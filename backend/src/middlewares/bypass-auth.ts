export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Bypass authentication for order creation
    if (ctx.url.includes('/api/orders') && ctx.method === 'POST') {
      ctx.state.auth = { strategy: { name: 'public' } };
    }
    // Bypass authentication for public product, category and product-category GET requests
    if ((ctx.url.includes('/api/products') || ctx.url.includes('/api/categories') || ctx.url.includes('/api/product-categories')) && ctx.method === 'GET') {
      ctx.state.auth = { strategy: { name: 'public' } };
    }
    await next();
  };
};