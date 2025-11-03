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
  ],
};