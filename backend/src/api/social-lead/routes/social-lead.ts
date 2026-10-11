export default {
  routes: [
    {
      method: 'GET',
      path: '/social-leads/analytics',
      handler: 'social-lead.getLeadAnalytics',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/social-leads/log',
      handler: 'social-lead.logLead',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/social-leads/webhook',
      handler: 'social-lead.verifyWebhook',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/social-leads/webhook',
      handler: 'social-lead.handleWebhookEvent',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};

