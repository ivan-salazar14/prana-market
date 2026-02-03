import cron from 'node-cron';

export default {
    /**
     * Cron job to sync products with MasterShop every 6 hours
     * Schedule: 0 *\/6 * * * (At minute 0 past every 6th hour)
     */
    async register({ strapi }) {
        // Only run cron jobs in production or if explicitly enabled
        // Check for generic ENABLE_PRODUCT_SYNC or specific providers
        const enableCron = process.env.ENABLE_PRODUCT_SYNC === 'true' ||
            process.env.ENABLE_MASTERSHOP_SYNC === 'true' ||
            process.env.NODE_ENV === 'production';

        if (!enableCron) {
            strapi.log.info('ℹ️  Product sync cron job is disabled (set ENABLE_PRODUCT_SYNC=true to enable)');
            return;
        }

        // Sync every 6 hours: at 00:00, 06:00, 12:00, 18:00
        cron.schedule('0 */6 * * *', async () => {
            strapi.log.info('⏰ MasterShop sync cron job triggered');

            try {
                // Call the MasterShop service
                const result = await strapi.service('api::product.mastershop').syncAllProducts();
                strapi.log.info('📊 Sync result:', JSON.stringify(result));
            } catch (error) {
                strapi.log.error('❌ Cron job error:', error);
            }
        });

        strapi.log.info('✅ MasterShop sync cron job registered (runs every 6 hours)');
    },
};
