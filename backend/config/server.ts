export default ({ env }) => {
  const host = env('HOST', '0.0.0.0');
  const port = env.int('PORT', 1337);

  return {
    host,
    port,
    app: {
      keys: env.array('APP_KEYS'),
    },
    url: env('URL', env('PUBLIC_URL', `http://${host}:${port}`)),
    proxy: env.bool('PROXY', true),
    cron: {
      enabled: false,
    },
  };
};
