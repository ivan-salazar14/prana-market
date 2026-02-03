import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({
    async syncToMasterShop(ctx) {
        const { id } = ctx.params;
        strapi.log.info(`Manual sync trigger for Order #${id}`);

        try {
            // 1. Fetch the order with full details
            const order = await strapi.documents('api::order.order').findOne({
                documentId: id, // Try documentId first
                populate: ['items', 'shippingAddress', 'deliveryMethod', 'user'],
            });

            let realOrder = order;

            if (!order) {
                // Fallback to numeric ID search if documentId fails
                const orders = await strapi.documents('api::order.order').findMany({
                    filters: { id: id },
                    populate: ['items', 'shippingAddress', 'deliveryMethod', 'user'],
                    limit: 1
                });
                if (orders.length > 0) realOrder = orders[0];
            }

            if (!realOrder) {
                return ctx.notFound('Order not found');
            }

            // 2. Call the MasterShop/Product service
            strapi.log.info(`Found order ${realOrder.id}, calling sendOrderToMasterShop...`);
            const result = await strapi.service('api::product.mastershop').sendOrderToMasterShop(realOrder);

            if (result && result.success) {
                return ctx.send({ message: 'Order synced successfully', data: result });
            } else {
                // Return 400 with the error context if sync failed
                return ctx.badRequest('Failed to sync to MasterShop', { error: result ? result.error : 'Unknown error' });
            }

        } catch (error) {
            strapi.log.error('Error in manual MasterShop sync:', error);
            return ctx.internalServerError('Internal server error during sync');
        }
    },
}));
