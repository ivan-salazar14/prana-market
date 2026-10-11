export default {
  routes: [
    {
      method: 'GET',
      path: '/catalog/instagram-feed.xml',
      handler: 'custom-catalog.generateInstagramFeed',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/products/instagram-feed.xml',
      handler: 'custom-catalog.generateInstagramFeed',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
