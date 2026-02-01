export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/:id/sync-mastershop',
      handler: 'custom-order.syncToMasterShop',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};