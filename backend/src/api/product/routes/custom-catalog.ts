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
    {
      method: 'POST',
      path: '/products/import-csv',
      handler: 'custom-catalog.importCsv',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/products/csv-template',
      handler: 'custom-catalog.getCsvTemplate',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
