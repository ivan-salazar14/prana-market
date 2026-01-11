
export default {
    beforeCreate(event) {
        const { data } = event.params;
        if (!data.status) {
            data.status = 'pending';
        }
    },

    beforeUpdate(event) {
        const { data } = event.params;
        if (data && (data.status === null || data.status === '')) {
            data.status = 'pending';
        }
    },
};
