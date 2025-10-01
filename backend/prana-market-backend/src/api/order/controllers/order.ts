/**
 * order controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
  async find(ctx) {
    // Allow public access to find orders
    return await super.find(ctx);
  },

  async create(ctx) {
    // Allow public access to create orders
    return await super.create(ctx);
  },
}));