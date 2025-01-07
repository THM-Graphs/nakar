export default {
  routes: [
    {
      method: 'GET',
      path: '/frontend/database',
      handler: 'frontend.getDatabases',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/frontend/room',
      handler: 'frontend.getRooms',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/frontend/room/:id',
      handler: 'frontend.getRoom',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/frontend/scenario-group',
      handler: 'frontend.getScenarioGroups',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/frontend/scenario',
      handler: 'frontend.getScenarios',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/frontend/scenario/:id/initial-graph',
      handler: 'frontend.getInitialGraph',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'GET',
      path: '/frontend/system/version',
      handler: 'frontend.getVersion',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
