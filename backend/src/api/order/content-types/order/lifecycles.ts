
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
        const id = result?.documentId || result?.id;

        if (result && (result.status === 'confirmed' || result.status === 'paid') && !result.mastershop_id) {
            // Run sync in background to avoid blocking UI and prevent 400 errors from bubbling up
            setImmediate(async () => {
                try {
                    strapi.log.info(`[Background Sync] Starting for new Order ${id}`);
                    const syncResult = await strapi.service('api::product.mastershop').sendOrderToMasterShop(result);

                    if (syncResult && syncResult.success) {
                        const mastershopId = syncResult.results?.[0]?.data?.id?.toString() || 'SYNCED';

                        await strapi.documents('api::order.order').update({
                            documentId: id,
                            data: {
                                mastershop_id: mastershopId,
                                mastershop_data: syncResult,
                                sync_mastershop: false
                            },
                            status: 'published'
                        });
                        strapi.log.info(`✅ [Background Sync] Order ${id} synced. MasterShop ID: ${mastershopId}`);
                    }
                } catch (error) {
                    strapi.log.error(`[Background Sync] Error for order ${id}:`, error);
                }
            });
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;
        const { data } = params;

        const orderId = result?.documentId || result?.id || params?.where?.documentId || params?.where?.id;

        // If status changed to 'confirmed' or 'paid' OR custom sync field is checked
        if (data && (data.status === 'confirmed' || data.status === 'paid' || data.sync_mastershop === true)) {
            // Run sync in background
            setImmediate(async () => {
                try {
                    if (!orderId) return;

                    // Re-fetch to check mastershop_id and ensure we have latest data
                    const order = await strapi.documents('api::order.order').findOne({
                        documentId: orderId,
                        populate: ['user']
                    });

                    if (order && (!order.mastershop_id || data.sync_mastershop === true)) {
                        strapi.log.info(`[Background Sync] Syncing updated order ${orderId} to MasterShop...`);
                        const syncResult = await strapi.service('api::product.mastershop').sendOrderToMasterShop(order);

                        if (syncResult && syncResult.success) {
                            const mastershopIdValue = syncResult.results?.[0]?.data?.id?.toString() || 'SYNCED';

                            await strapi.documents('api::order.order').update({
                                documentId: orderId,
                                data: {
                                    mastershop_id: mastershopIdValue,
                                    mastershop_data: syncResult,
                                    sync_mastershop: false
                                },
                                status: 'published'
                            });
                            strapi.log.info(`✅ [Background Sync] Order ${orderId} synced. ID: ${mastershopIdValue}`);
                        } else {
                            strapi.log.error(`❌ [Background Sync] Sync failed for order ${orderId}: ${JSON.stringify(syncResult)}`);
                        }
                    }
                } catch (error) {
                    strapi.log.error(`[Background Sync] Error for order ${orderId}:`, error);
                }
            });
        }
    },
};
