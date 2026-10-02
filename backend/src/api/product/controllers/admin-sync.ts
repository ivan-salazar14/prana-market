/**
 * admin-sync controller
 * Temporary endpoint to force product sync
 */

export default {
    async ingestCatalog(ctx) {
        try {
            strapi.log.info('🚀 Manual MasterShop catalog ingestion triggered...');
            const params = ctx.request.body || ctx.query || {};
            const result = await strapi.service('api::product.mastershop').ingestMasterShopCatalog(params);
            return ctx.send({ message: 'Catalog ingestion completed', result });
        } catch (error: any) {
            strapi.log.error('Error in catalog ingestion endpoint:', error);
            return ctx.badRequest('Ingestion failed', { error: error.message });
        }
    },

    async syncProducts(ctx) {
        try {
            strapi.log.info('🚀 Manual MasterShop stock/price sync triggered via API...');
            const result = await strapi.service('api::product.mastershop').syncAllProducts();
            return ctx.send({ message: 'Stock and price sync process completed', result });
        } catch (error: any) {
            strapi.log.error('Error in sync endpoint:', error);
            return ctx.badRequest('Sync failed', { error: error.message });
        }
    },

    async syncTracking(ctx) {
        try {
            strapi.log.info('🚚 Manual MasterShop carrier guide sync triggered via API...');
            const result = await strapi.service('api::product.mastershop').syncCarrierGuides();
            return ctx.send({ message: 'Carrier guide sync completed', result });
        } catch (error: any) {
            strapi.log.error('Error in carrier sync endpoint:', error);
            return ctx.badRequest('Carrier sync failed', { error: error.message });
        }
    },
};
