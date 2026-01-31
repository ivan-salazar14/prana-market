/**
 * admin-sync routes
 */

export default {
    routes: [
        {
            method: 'GET', // GET for easy browser access
            path: '/products/admin/sync',
            handler: 'admin-sync.syncProducts',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
