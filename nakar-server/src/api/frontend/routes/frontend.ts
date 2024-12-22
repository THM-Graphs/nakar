export default {
  routes: [
    {
      method: 'GET',
      path: '/frontend/initial-graph',
      handler: 'frontend.initialGraph',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/frontend/scenarios',
      handler: 'frontend.scenarios',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
