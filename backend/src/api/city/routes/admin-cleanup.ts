/**
 * admin-cleanup routes
 */

export default {
    routes: [
        {
            method: 'GET',
            path: '/cities/admin/cleanup',
            handler: 'admin-cleanup.cleanupDuplicates',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
