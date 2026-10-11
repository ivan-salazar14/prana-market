export default {
  routes: [
    {
      method: 'GET',
      path: '/social-proofs',
      handler: 'social-proof.getApproved',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/social-proofs/moderate/:id',
      handler: 'social-proof.moderate',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
