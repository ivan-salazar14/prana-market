
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
        // If created with status 'confirmed' (e.g. from frontend logic for certain payments)
        if (result && result.status === 'confirmed') {
            /* 
             // Dropi Sync disabled as we are using MasterShop only for now
             try {
                await strapi.service('api::order.dropi').sendOrderToDropi(result);
            } catch (error) {
                strapi.log.error('Error in Dropi afterCreate hook:', error);
            }
            */
            try {
                await strapi.service('api::product.mastershop').sendOrderToMasterShop(result);
            } catch (error) {
                strapi.log.error('Error in MasterShop afterCreate hook:', error);
            }
        }
    },

    async afterUpdate(event) {
        const { result, params } = event;
        const { data } = params;

        // If status changed to 'confirmed'
        if (data && data.status === 'confirmed') {
            /*
            // Dropi Sync disabled as we are using MasterShop only for now
            try {
                // 1. Sync with Dropi (Existing)
                await strapi.service('api::order.dropi').sendOrderToDropi(result);
            } catch (error) {
                strapi.log.error('Error in Dropi afterUpdate hook:', error);
            }
            */

            try {
                // 2. Sync with MasterShop (New)
                // We pass the full result which contains items, shippingAddress, etc.
                await strapi.service('api::product.mastershop').sendOrderToMasterShop(result);
            } catch (error) {
                strapi.log.error('Error in MasterShop afterUpdate hook:', error);
            }
        }
    },
};
