export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/track',
      handler: 'custom-order.trackOrder',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/orders/dropship-sync-status',
      handler: 'custom-order.getDropshipSyncStatus',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'PUT',
      path: '/orders/:id/update-status',
      handler: 'custom-order.updateOrderStatus',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/orders/:id/sync-mastershop',
      handler: 'custom-order.syncToMasterShop',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/orders/:id/update-address',
      handler: 'custom-order.updateShippingAddress',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/orders/:id/mark-manual',
      handler: 'custom-order.markManualDispatch',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/orders/:id/trigger-alert',
      handler: 'custom-order.triggerOperationalAlert',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};