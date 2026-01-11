export default {
  routes: [
    {
      method: 'POST',
      path: '/orders/public',
      handler: 'order.create',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Disable authentication completely
      },
    },
    {
      method: 'GET',
      path: '/orders/public',
      handler: 'order.find',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow API token access
      },
    },
  ],
};