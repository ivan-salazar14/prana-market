export function classifyOrderFulfillment(items: any[]): {
    fulfillmentType: 'local' | 'dropship' | 'hybrid';
    dropshipItems: any[];
    localItems: any[];
} {
    if (!Array.isArray(items) || items.length === 0) {
        return { fulfillmentType: 'local', dropshipItems: [], localItems: [] };
    }

    const dropshipItems: any[] = [];
    const localItems: any[] = [];

    for (const item of items) {
        // If explicitly marked as mastershop_dropship or has dropship supplier IDs
        if (
            item.sourcing_type === 'mastershop_dropship' ||
            item.mastershop_id ||
            item.dropi_id ||
            item.isDropship === true
        ) {
            dropshipItems.push(item);
        } else {
            localItems.push(item);
        }
    }

    if (dropshipItems.length > 0 && localItems.length > 0) {
        return { fulfillmentType: 'hybrid', dropshipItems, localItems };
    } else if (dropshipItems.length > 0) {
        return { fulfillmentType: 'dropship', dropshipItems, localItems: [] };
    } else {
        return { fulfillmentType: 'local', dropshipItems: [], localItems };
    }
}

export default {
    beforeCreate(event) {
        const { data } = event.params;
        if (!data.status) {
            data.status = 'paid';
        }
        if (data.items) {
            const { fulfillmentType } = classifyOrderFulfillment(data.items);
            data.fulfillment_type = fulfillmentType;
            if (fulfillmentType === 'local') {
                data.sync_mastershop = false;
            }
        }
    },

    beforeUpdate(event) {
        const { data } = event.params;
        if (data && (data.status === null || data.status === '')) {
            data.status = 'paid';
        }
        if (data && data.items) {
            const { fulfillmentType } = classifyOrderFulfillment(data.items);
            data.fulfillment_type = fulfillmentType;
            if (fulfillmentType === 'local') {
                data.sync_mastershop = false;
            }
        }
    },

    async afterCreate(event) {
        const { result } = event;
        const id = result?.documentId || result?.id;

        if (result && (result.status === 'confirmed' || result.status === 'paid') && !result.mastershop_id) {
            // Story 8.2: Inspect items sourcing type before attempting MasterShop dispatch
            const { fulfillmentType, dropshipItems } = classifyOrderFulfillment(result.items);

            if (fulfillmentType === 'local') {
                strapi.log.info(
                    `📦 [Fulfillment Routing] Order ${id} is 100% LOCAL bodega inventory. Bypassing MasterShop dispatch.`
                );
                await strapi.documents('api::order.order').update({
                    documentId: id,
                    data: {
                        fulfillment_type: 'local',
                        sync_mastershop: false,
                    },
                    status: 'published',
                });
                return;
            }

            // Run dropship or hybrid sync in background
            setImmediate(async () => {
                try {
                    strapi.log.info(`[Background Sync] Starting ${fulfillmentType} dispatch for new Order ${id}`);
                    const orderToSync = fulfillmentType === 'hybrid'
                        ? { ...result, items: dropshipItems }
                        : result;

                    const syncResult = await strapi.service('api::product.mastershop').sendOrderToMasterShop(orderToSync);

                    if (syncResult && syncResult.success) {
                        const mastershopId = syncResult.results?.[0]?.data?.id?.toString() || 'SYNCED';

                        await strapi.documents('api::order.order').update({
                            documentId: id,
                            data: {
                                mastershop_id: mastershopId,
                                mastershop_data: syncResult,
                                fulfillment_type: fulfillmentType,
                                sync_mastershop: false,
                            },
                            status: 'published',
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
            setImmediate(async () => {
                try {
                    if (!orderId) return;

                    // Re-fetch to check mastershop_id and ensure latest data
                    const order = await strapi.documents('api::order.order').findOne({
                        documentId: orderId,
                        populate: ['user'],
                    });

                    if (!order) return;

                    // Story 8.2: Inspect sourcing types
                    const { fulfillmentType, dropshipItems } = classifyOrderFulfillment(order.items);

                    if (fulfillmentType === 'local') {
                        strapi.log.info(
                            `📦 [Fulfillment Routing] Updated Order ${orderId} is 100% LOCAL bodega inventory. Bypassing MasterShop dispatch.`
                        );
                        await strapi.documents('api::order.order').update({
                            documentId: orderId,
                            data: {
                                fulfillment_type: 'local',
                                sync_mastershop: false,
                            },
                            status: 'published',
                        });
                        return;
                    }

                    if (!order.mastershop_id || data.sync_mastershop === true) {
                        strapi.log.info(
                            `[Background Sync] Syncing ${fulfillmentType} order ${orderId} to MasterShop...`
                        );
                        const orderToSync = fulfillmentType === 'hybrid'
                            ? { ...order, items: dropshipItems }
                            : order;

                        const syncResult = await strapi.service('api::product.mastershop').sendOrderToMasterShop(orderToSync);

                        if (syncResult && syncResult.success) {
                            const mastershopIdValue = syncResult.results?.[0]?.data?.id?.toString() || 'SYNCED';

                            await strapi.documents('api::order.order').update({
                                documentId: orderId,
                                data: {
                                    mastershop_id: mastershopIdValue,
                                    mastershop_data: syncResult,
                                    fulfillment_type: fulfillmentType,
                                    sync_mastershop: false,
                                },
                                status: 'published',
                            });
                            strapi.log.info(`✅ [Background Sync] Order ${orderId} synced. ID: ${mastershopIdValue}`);
                        } else {
                            strapi.log.error(
                                `❌ [Background Sync] Sync failed for order ${orderId}: ${JSON.stringify(syncResult)}`
                            );
                        }
                    }
                } catch (error) {
                    strapi.log.error(`[Background Sync] Error for order ${orderId}:`, error);
                }
            });
        }
    },
};
