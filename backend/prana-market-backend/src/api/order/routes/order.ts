/**
 * order router.
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreRouter('api::order.order', {
  config: {
    create: {
      policies: [],
      middlewares: ['global::bypass-auth'],
    },
    find: {
      policies: [],
      middlewares: [],
    },
  },
});