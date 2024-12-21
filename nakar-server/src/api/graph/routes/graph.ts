export default {
  routes: [
    {
      method: 'GET',
      path: '/graph/initial',
      handler: 'graph.initial',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
