/**
 * admin-seed routes
 */

export default {
    routes: [
        {
            method: 'POST',
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
