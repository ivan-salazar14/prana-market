/**
 * admin-sync controller
 * Temporary endpoint to force product sync
 */

export default {
    async syncProducts(ctx) {
        try {
            // Basic security
            const token = ctx.request.query.token;
            const expectedToken = process.env.ADMIN_SEED_TOKEN || 'change-me-in-production';

            if (token !== expectedToken) {
                return ctx.unauthorized('Invalid token');
            }

            strapi.log.info('🚀 Starting manual Dropi sync via API...');

            const result = await strapi.service('api::product.dropi-sync').syncAllProducts();

            return ctx.send({
                message: 'Sync process completed',
                result,
            });
        } catch (error) {
            strapi.log.error('Error in sync endpoint:', error);
            return ctx.badRequest('Sync failed', { error: error.message });
        }
    },
};
