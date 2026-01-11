// import type { Core } from '@strapi/strapi';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) { },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }) {
    // Fix orders with empty status
    try {
      // Using db.query for direct database access to fix records
      const ordersToFix = await strapi.db.query('api::order.order').findMany({
        where: {
          $or: [
            { status: { $null: true } },
            { status: { $eq: '' } },
            {
              status: {
                $notIn: [
                  'pending', 'confirmed', 'paid', 'processing',
                  'in_transit', 'shipped', 'delivered', 'cancelled', 'refunded'
                ]
              }
            }
          ]
        }
      });

      if (ordersToFix && ordersToFix.length > 0) {
        console.log(`[Bootstrap] Found ${ordersToFix.length} orders with invalid or empty status. Fixing...`);
        for (const order of ordersToFix) {
          await strapi.db.query('api::order.order').update({
            where: { id: order.id },
            data: { status: 'pending' }
          });
        }
        console.log('[Bootstrap] Orders status fixed successfully.');
      }
    } catch (error) {
      console.error('[Bootstrap] Error fixing orders status:', error);
    }
  },
};
