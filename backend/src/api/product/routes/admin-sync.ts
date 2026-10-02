/**
 * admin-sync routes
 */

export default {
    routes: [
        {
            method: 'POST',
            path: '/products/admin/ingest',
            handler: 'admin-sync.ingestCatalog',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/products/admin/sync',
            handler: 'admin-sync.syncProducts',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
        {
            method: 'GET',
            path: '/products/admin/carrier-sync',
            handler: 'admin-sync.syncTracking',
            config: {
                auth: false,
                policies: [],
                middlewares: [],
            },
        },
    ],
};
