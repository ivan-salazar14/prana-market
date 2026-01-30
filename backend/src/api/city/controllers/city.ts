/**
 * city controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::city.city', ({ strapi }) => ({
    async find(ctx) {
        // Override to return all cities without pagination
        const entities = await strapi.documents('api::city.city').findMany({
            fields: ['name', 'department'],
            limit: 10000, // Set a high limit instead of -1
        });

        return { data: entities };
    },
}));
