export default ({ env }) => {
  const host = env('HOST', 'localhost');
  const port = env.int('PORT', 1337);
  const publicUrl = env('PUBLIC_URL', `http://${host}:${port}`);
  
  return {
    host: host === '0.0.0.0' ? 'localhost' : host,
    port,
    app: {
      keys: env.array('APP_KEYS'),
    },
    url: publicUrl,
    proxy: env.bool('PROXY', false),
    cron: {
      enabled: false,
    },
  };
};
