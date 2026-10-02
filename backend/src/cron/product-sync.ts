import cron from 'node-cron';

export default {
    /**
     * MasterShop Cron jobs:
     * 1. Stock & Dynamic Price Sync (every 30 mins)
     * 2. Carrier Tracking Guide Ingestion & Customer Notifications (every 30 mins)
     */
    async register({ strapi }) {
        const enableCron = process.env.ENABLE_PRODUCT_SYNC === 'true' ||
            process.env.ENABLE_MASTERSHOP_SYNC === 'true' ||
            process.env.NODE_ENV === 'production';

        if (!enableCron) {
            strapi.log.info('ℹ️ MasterShop cron workers are disabled (set ENABLE_MASTERSHOP_SYNC=true to enable)');
            return;
        }

        const stockSchedule = process.env.MASTERSHOP_STOCK_CRON || '*/30 * * * *';
        cron.schedule(stockSchedule, async () => {
            strapi.log.info('⏰ [Cron Worker] MasterShop Stock & Dynamic Price Sync triggered');
            try {
                const result = await strapi.service('api::product.mastershop').syncAllProducts();
                strapi.log.info('📊 Stock Sync Result:', JSON.stringify(result));
            } catch (error) {
                strapi.log.error('❌ Stock Sync Cron Error:', error);
            }
        });

        const trackingSchedule = process.env.MASTERSHOP_TRACKING_CRON || '15,45 * * * *';
        cron.schedule(trackingSchedule, async () => {
            strapi.log.info('⏰ [Cron Worker] MasterShop Carrier Guide Ingestion triggered');
            try {
                const result = await strapi.service('api::product.mastershop').syncCarrierGuides();
                strapi.log.info('🚚 Carrier Guide Ingestion Result:', JSON.stringify(result));
            } catch (error) {
                strapi.log.error('❌ Tracking Sync Cron Error:', error);
            }
        });

        strapi.log.info(`✅ MasterShop cron workers registered (Stock: ${stockSchedule}, Tracking: ${trackingSchedule})`);
    },
};

