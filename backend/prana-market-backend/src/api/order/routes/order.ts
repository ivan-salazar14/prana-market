/**
 * order router.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::order.order', {
  config: {
    create: {
      policies: [],
      middlewares: [],
    },
    find: {
      policies: [],
      middlewares: [],
    },
  },
});