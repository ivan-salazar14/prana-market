/**
 * admin-seed routes
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/cities/admin/seed',
            handler: 'admin-seed.seedCities',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
