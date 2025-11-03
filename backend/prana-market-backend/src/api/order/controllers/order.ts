/**
2
 * order controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async find(ctx) {
    // Require authentication
    if (!ctx.state.user) {
      return ctx.unauthorized('Authentication required');
    }

    // Filter orders to only show the authenticated user's orders
    ctx.query.filters = Object.assign(ctx.query.filters || {}, { user: ctx.state.user.id });

    return await super.find(ctx);
  },

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

      if (orderData.total) orderData.total = parseFloat(orderData.total) || 0;
      if (orderData.subtotal) orderData.subtotal = parseFloat(orderData.subtotal) || 0;
      if (orderData.deliveryCost) orderData.deliveryCost = parseFloat(orderData.deliveryCost) || 0;

      console.log('Final orderData:', orderData);

      // Create the order directly using the service
      const result = await strapi.service('api::order.order').create({
        data: orderData
      });

      ctx.send(result);
    } catch (error) {
      console.error('Order creation error:', error);
      ctx.badRequest('Unable to create order', { error: error.message });
    }
  },
}));