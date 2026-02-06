
export default {
    beforeCreate(event) {
        const { data } = event.params;
        if (!data.status) {
            data.status = 'paid';
        }
    },

    beforeUpdate(event) {
        const { data } = event.params;
        if (data && (data.status === null || data.status === '')) {
            data.status = 'paid';
        }
    },

    async afterCreate(event) {
        const { result } = event;
        // If created with status 'confirmed' or 'paid'
        if (result && (result.status === 'confirmed' || result.status === 'paid') && !result.mastershop_id) {
            try {
                strapi.log.info(`Syncing new order ${result.id} to MasterShop...`);
                const syncResult = await strapi.service('api::product.mastershop').sendOrderToMasterShop(result);

                if (syncResult && syncResult.success) {
                    const mastershopId = syncResult.results?.[0]?.data?.id?.toString() || 'SYNCED';
                    await strapi.db.query('api::order.order').update({
                        where: { id: result.id },
                        data: {
                            mastershop_id: mastershopId,
                            mastershop_data: syncResult
                        }
                    });
                }
            } catch (error) {
                strapi.log.error('Error in MasterShop afterCreate hook:', error);
            }
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;
        const { data } = params;

        // If status changed to 'confirmed' or 'paid' AND not already synced
        if (data && (data.status === 'confirmed' || data.status === 'paid')) {
            // Re-fetch to check mastershop_id (result might be stale or not containing all fields)
            const order = await strapi.db.query('api::order.order').findOne({
                where: { id: result.id }
            });

            if (order && !order.mastershop_id) {
                try {
                    strapi.log.info(`Syncing updated order ${result.id} to MasterShop (Status: ${data.status})...`);
                    const syncResult = await strapi.service('api::product.mastershop').sendOrderToMasterShop(order);

                    if (syncResult && syncResult.success) {
                        const mastershopId = syncResult.results?.[0]?.data?.id?.toString() || 'SYNCED';
                        await strapi.db.query('api::order.order').update({
                            where: { id: result.id },
                            data: {
                                mastershop_id: mastershopId,
                                mastershop_data: syncResult
                            }
                        });
                        strapi.log.info(`✅ Order ${result.id} successfully synced to MasterShop. ID: ${mastershopId}`);
                    }
                } catch (error) {
                    strapi.log.error('Error in MasterShop afterUpdate hook:', error);
                }
            } else if (order && order.mastershop_id) {
                strapi.log.info(`Order ${result.id} already synced to MasterShop (ID: ${order.mastershop_id}). Skipping.`);
            }
        }
    },
};
