'use strict';

/**
 * dropi-webhook controller
 */

module.exports = {
    async statusUpdate(ctx) {
        const { body } = ctx.request;

        strapi.log.info(`Received Dropi webhook: ${JSON.stringify(body)}`);

        // Dropi payload mapping (Example structure based on common webhooks)
        // You'll need to adjust fields like 'order_id' or 'status' to match Dropi's exact payload.
        const dropiOrderId = body.order_id || body.id;
        const dropiStatus = body.status; // e.g., 'shipped', 'delivered'
        const trackingNumber = body.tracking_number;
        const trackingUrl = body.tracking_url;

        if (!dropiOrderId) {
            return ctx.badRequest('Missing Dropi order ID');
        }

        try {
            // Find the corresponding order in Strapi
            const order = await strapi.query('api::order.order').findOne({
                where: { dropi_order_id: dropiOrderId.toString() }
            });

            if (!order) {
                strapi.log.warn(`Order with dropi_order_id ${dropiOrderId} not found.`);
                return ctx.notFound('Order not found');
            }

            // Map Dropi status to Strapi shipping_status
            // You should expand this mapping based on Dropi's documentation
            let shippingStatus = 'pending';
            if (dropiStatus === 'despachado' || dropiStatus === 'shipped') shippingStatus = 'shipped';
            if (dropiStatus === 'entregado' || dropiStatus === 'delivered') shippingStatus = 'delivered';
            if (dropiStatus === 'en_transito' || dropiStatus === 'in_transit') shippingStatus = 'in_transit';
            if (dropiStatus === 'devuelto' || dropiStatus === 'returned') shippingStatus = 'returned';

            // Update the order
            await strapi.entityService.update('api::order.order', order.id, {
                data: {
                    shipping_status: shippingStatus,
                    tracking_number: trackingNumber || order.tracking_number,
                    tracking_url: trackingUrl || order.tracking_url,
                    // Optionally update the main status if it's delivered
                    status: shippingStatus === 'delivered' ? 'delivered' : order.status
                }
            });

            strapi.log.info(`Order ${order.id} updated via Dropi webhook (${shippingStatus})`);

            return ctx.send({ ok: true });
        } catch (error) {
            strapi.log.error(`Error processing Dropi webhook: ${error.message}`);
            return ctx.internalServerError('Error processing webhook');
        }
    }
};
