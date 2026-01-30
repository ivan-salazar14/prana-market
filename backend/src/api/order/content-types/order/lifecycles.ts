
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

    async afterUpdate(event) {
        const { result, params } = event;
        const { data } = params;

        // If status changed to 'confirmed', send to Dropi
        if (data && data.status === 'confirmed') {
            try {
                // We use the full result to get all order details
                await strapi.service('api::order.dropi').sendOrderToDropi(result);
            } catch (error) {
                strapi.log.error('Error in Dropi afterUpdate hook:', error);
            }
        }
    },
};
