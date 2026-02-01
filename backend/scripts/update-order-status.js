const { createStrapi } = require('@strapi/strapi');

async function updateOrderStatus(orderId, newStatus) {
    const strapi = await createStrapi({ distDir: './dist' }).load();

    try {
        console.log(`Updating order ${orderId} to status: ${newStatus}`);

        const order = await strapi.documents('api::order.order').findOne({
            documentId: orderId // Note: Strapi 5 uses documentId for content manager operations usually, but let's check input
        });

        if (!order) {
            console.error('Order not found with that Document ID. Trying numeric ID lookup...');
            const orders = await strapi.documents('api::order.order').findMany({
                filters: { id: orderId }
            });
            if (orders.length > 0) {
                const realOrder = orders[0];
                await strapi.documents('api::order.order').update({
                    documentId: realOrder.documentId,
                    data: { status: newStatus }
                });
                console.log(`✅ Order ${realOrder.id} updated successfully to '${newStatus}'`);
            } else {
                console.error('❌ Order not found');
            }
        } else {
            await strapi.documents('api::order.order').update({
                documentId: orderId,
                data: { status: newStatus }
            });
            console.log(`✅ Order updated successfully to '${newStatus}'`);
        }

    } catch (error) {
        console.error('❌ Error updating order:', error);
        console.error('Validation errors:', JSON.stringify(error.details, null, 2));
    }

    strapi.stop();
}

// Get arguments from command line
const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Usage: node scripts/update-order-status.js <ORDER_ID_OR_DOCUMENT_ID> <STATUS>');
    console.log('Example: node scripts/update-order-status.js 15 confirmed');
    console.log('Available statuses: pending, confirmed, paid, processing, in_transit, shipped, delivered, cancelled, refunded');
    process.exit(1);
}

updateOrderStatus(args[0], args[1]);
