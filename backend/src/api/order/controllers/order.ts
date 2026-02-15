/**
 * order controller
 */

import { factories } from '@strapi/strapi';
import { sendOrderEmail } from '../services/order';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async find(ctx) {
    try {
      let userId: number | null = null;

      // If user is authenticated via JWT, use their ID
      if (ctx.state.user) {
        userId = ctx.state.user.id;
      } else {
        // If using API token, extract userId from query filters
        const filters = ctx.query?.filters as any;
        console.log('Query filters:', JSON.stringify(filters, null, 2));

        if (!filters) {
          // No filters provided, return all orders (public access)
          const { results, pagination } = await strapi.service('api::order.order').find({
            ...ctx.query,
          });
          const sanitizedResults = await (this as any).sanitizeOutput(results, ctx);
          return (this as any).transformResponse(sanitizedResults, { pagination });
        }

        // Try different formats for the user filter
        let userIdFromQuery = filters?.user?.id?.$eq ||
          filters?.user?.id?.$in?.[0] ||
          filters?.user?.id;

        // Also check if it's a direct user ID (not nested)
        if (!userIdFromQuery && filters?.user) {
          userIdFromQuery = typeof filters.user === 'number' || typeof filters.user === 'string'
            ? filters.user
            : null;
        }

        if (userIdFromQuery) {
          userId = parseInt(userIdFromQuery);
        } else {
          // If no user filter and no authenticated user, return all orders
          const { results, pagination } = await strapi.service('api::order.order').find({
            ...ctx.query,
          });
          const sanitizedResults = await (this as any).sanitizeOutput(results, ctx);
          return (this as any).transformResponse(sanitizedResults, { pagination });
        }
      }

      // Use service directly to avoid validation issues with relation filters
      // For manyToOne relations in Strapi 5, use the ID directly
      const { results, pagination } = await strapi.service('api::order.order').find({
        filters: { user: userId },
        ...ctx.query,
      });

      const sanitizedResults = await (this as any).sanitizeOutput(results, ctx);

      return (this as any).transformResponse(sanitizedResults, { pagination });
    } catch (error) {
      console.error('Error in find controller:', error);
      return ctx.badRequest('Error fetching orders', { error: error.message });
    }
  },

  /**
   * Creates a new order.
   * @param ctx - Koa context object.
   * @returns The created order object.
   */
  async create(ctx) {
    try {
      // Allow public access to create orders - bypass auth completely
      ctx.state.auth = { strategy: { name: 'public' } };

      console.log('Request body:', ctx.request.body);

      // The body is already parsed by the body parser middleware
      let orderData = { ...ctx.request.body };

      // Handle the items field
      if (orderData.items && typeof orderData.items === 'string') {
        try {
          orderData.items = JSON.parse(orderData.items);
        } catch (e) {
          console.error('Failed to parse items:', e);
        }
      }

      // Handle the deliveryMethod field
      if (orderData.deliveryMethod && typeof orderData.deliveryMethod === 'string') {
        try {
          orderData.deliveryMethod = JSON.parse(orderData.deliveryMethod);
        } catch (e) {
          console.error('Failed to parse deliveryMethod:', e);
        }
      }

      // Handle the shippingAddress field
      if (orderData.shippingAddress && typeof orderData.shippingAddress === 'string') {
        try {
          orderData.shippingAddress = JSON.parse(orderData.shippingAddress);
        } catch (e) {
          console.error('Failed to parse shippingAddress:', e);
        }
      }

      if (orderData.total) orderData.total = parseFloat(orderData.total) || 0;
      if (orderData.subtotal) orderData.subtotal = parseFloat(orderData.subtotal) || 0;
      if (orderData.deliveryCost) orderData.deliveryCost = parseFloat(orderData.deliveryCost) || 0;

      // Ensure status is captured and default to 'pending' for new orders
      orderData.status = orderData.status || 'pending';

      // Convert user to number if it comes as string
      if (orderData.user && typeof orderData.user === 'string') {
        orderData.user = parseInt(orderData.user, 10);
      }

      // START TRANSACTION FOR INVENTORY MANAGEMENT
      const result = await strapi.db.transaction(async ({ rollback }) => {
        const items = orderData.items || [];

        // 1. Verify availability and prepare updates
        const stockUpdates = [];

        for (const item of items) {
          if (!item.id) continue;

          const product = await strapi.query('api::product.product').findOne({
            where: { id: item.id }
          });

          if (!product) {
            console.error(`Product not found: ${item.id}`);
            throw new Error(`Producto no encontrado (ID: ${item.id})`);
          }

          if (product.stock < item.quantity) {
            console.error(`Insufficient stock for product ${product.name}: has ${product.stock}, requested ${item.quantity}`);
            throw new Error(`Stock insuficiente para ${product.name}. Disponible: ${product.stock}`);
          }

          stockUpdates.push({
            id: item.id,
            newStock: product.stock - item.quantity,
            name: product.name
          });
        }

        // 2. Deduct stock
        for (const update of stockUpdates) {
          await strapi.query('api::product.product').update({
            where: { id: update.id },
            data: { stock: update.newStock }
          });
          console.log(`Stock updated for ${update.name}: ${update.newStock}`);
        }

        // 3. Create the order
        const createdOrder = await strapi.service('api::order.order').create({
          data: orderData
        });

        return createdOrder;
      });

      // Send email notifications (non-blocking) - outside transaction to avoid delaying it
      try {
        await sendOrderEmail(strapi, result);
      } catch (emailError) {
        console.error('Error sending order emails:', emailError);
      }

      ctx.send(result);
    } catch (error) {
      console.error('Order creation error:', error);
      ctx.badRequest(error.message || 'Unable to create order');
    }
  },
}));