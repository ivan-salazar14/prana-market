'use strict';

/**
 * dropi-webhook route
 */

module.exports = {
    routes: [
        {
            method: 'POST',
            path: '/dropi/webhook',
            handler: 'dropi-webhook.statusUpdate',
            config: {
                auth: false, // Dropi needs to call this without a JWT
                policies: [],
                middlewares: [],
            },
        },
    ],
};
