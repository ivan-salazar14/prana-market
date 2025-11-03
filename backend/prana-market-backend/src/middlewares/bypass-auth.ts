export default (config, { strapi }) => {
  return async (ctx, next) => {
    // Bypass authentication for order creation
    if (ctx.url.includes('/api/orders') && ctx.method === 'POST') {
      ctx.state.auth = { strategy: { name: 'public' } };
    }
    await next();
  };
};