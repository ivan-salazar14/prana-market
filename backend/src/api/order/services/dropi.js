'use strict';

/**
 * dropi service
 */

module.exports = ({ strapi }) => ({
    async sendOrderToDropi(order) {
        const apiToken = process.env.DROPI_API_TOKEN;
        const apiUrl = process.env.DROPI_API_URL || 'https://api.dropi.co/api/v2';

        if (!apiToken) {
            strapi.log.error('Dropi API Token is missing. Please set DROPI_API_TOKEN in .env');
            return;
        }

        try {
            // Mapping Strapi Order to Dropi Schema
            // Note: This mapping depends on the exact Dropi API documentation.
            // Assuming common fields for a Dropshipping order.

            const shippingAddress = order.shippingAddress || {};
            const items = order.items || [];

            // Dropi usually expects a specific format for products
            const products = items.map(item => ({
                sku: item.sku || item.id,
                quantity: item.quantity,
                price: item.price
            }));

            const payload = {
                customer: {
                    name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
                    phone: shippingAddress.phone || '',
                    email: shippingAddress.email || order.user?.email || '',
                    address: shippingAddress.address || '',
                    city: shippingAddress.city || '',
                    department: shippingAddress.state || shippingAddress.department || '',
                },
                products: products,
                payment_method: order.payment_method_type === 'cod' ? 'efectivo' : 'transferencia', // cod/online
                total_value: order.total,
                order_reference: order.id.toString(),
                // Add other Dropi specific fields here
            };

            strapi.log.info(`Sending order ${order.id} to Dropi...`);

            const response = await fetch(`${apiUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                strapi.log.error(`Dropi API Error: ${JSON.stringify(data)}`);
                return;
            }

            strapi.log.info(`Order ${order.id} successfully sent to Dropi. Dropi ID: ${data.id}`);

            // Update order with Dropi ID
            await strapi.entityService.update('api::order.order', order.id, {
                data: {
                    dropi_order_id: data.id?.toString() || data.order_id?.toString(),
                    shipping_status: 'pending'
                }
            });

        } catch (error) {
            strapi.log.error(`Failed to send order to Dropi: ${error.message}`);
        }
    }
});
