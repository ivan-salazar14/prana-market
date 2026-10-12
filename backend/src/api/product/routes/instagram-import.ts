export default {
  routes: [
    {
      method: 'POST',
      path: '/products/extract-instagram',
      handler: 'instagram-import.extractPost',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/products/extract-instagram',
      handler: 'instagram-import.extractPost',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/products/publish-instagram',
      handler: 'instagram-import.publishProduct',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
