const { createStrapi } = require('@strapi/strapi');

async function debugOrder(orderId) {
    const strapi = await createStrapi({ distDir: './dist' }).load();

    try {
        console.log(`Debug Order ${orderId}`);

        const orders = await strapi.documents('api::order.order').findMany({
            filters: { id: orderId }
        });

        if (orders.length > 0) {
            const order = orders[0];
            console.log('Order Found:', JSON.stringify(order, null, 2));
            console.log('Items:', JSON.stringify(order.items, null, 2));

            if (order.items && Array.isArray(order.items)) {
                for (const item of order.items) {
                    console.log(`Checking Item ID: ${item.id}`);
                    // Try to find product by numeric ID if that's what is stored
                    const productsNumeric = await strapi.documents('api::product.product').findMany({
                        filters: { id: item.id }
                    });
                    if (productsNumeric.length > 0) {
                        console.log(`> Found Product by Numeric ID ${item.id}:`, productsNumeric[0].mastershop_id ? `Has MasterShop ID: ${productsNumeric[0].mastershop_id}` : 'NO MasterShop ID');
                    } else {
                        console.log(`> Product not found by numeric ID ${item.id}`);
                    }
                }
            }

        } else {
            console.error('Order not found');
        }

    } catch (error) {
        console.error('Error:', error);
    }

    strapi.stop();
}

const args = process.argv.slice(2);
debugOrder(args[0]);
