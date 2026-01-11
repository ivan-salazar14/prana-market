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
        const filters = ctx.query.filters as any;
        console.log('Query filters:', JSON.stringify(filters, null, 2));

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
          // If no user filter and no authenticated user, return unauthorized
          return ctx.unauthorized('Authentication required or user filter must be provided');
        }
      }

      // Use service directly to avoid validation issues with relation filters
      // For manyToOne relations in Strapi 5, use the ID directly
      const { results, pagination } = await strapi.service('api::order.order').find({
        filters: { user: userId },
        ...ctx.query,
      });

      const sanitizedResults = await strapi.contentAPI.sanitize.output(results, {
        contentType: strapi.contentTypes['api::order.order'],
      });

      return strapi.contentAPI.transform.response(sanitizedResults, {
        contentType: strapi.contentTypes['api::order.order'],
        pagination,
      });
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
      console.log('Request type:', ctx.request.type);

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

      // Ensure status is captured and default to 'paid' for new orders from frontend
      orderData.status = orderData.status || 'paid';

      console.log('Final orderData for creation:', JSON.stringify(orderData, null, 2));

      // Convert user a número si viene como string
      if (orderData.user && typeof orderData.user === 'string') {
        orderData.user = parseInt(orderData.user, 10);
      }
      console.log('orderData:', orderData);
      // Create the order directamente usando el ID de usuario correcto
      const result = await strapi.service('api::order.order').create({
        data: orderData
      });

      // Send email notifications (non-blocking)
      try {
        await sendOrderEmail(strapi, result);
      } catch (emailError) {
        console.error('Error sending order emails:', emailError);
        // Continue even if email fails - order is already created
      }

      ctx.send(result);
    } catch (error) {
      console.error('Order creation error:', error);
      ctx.badRequest('Unable to create order', { error: error.message });
    }
  },
}));