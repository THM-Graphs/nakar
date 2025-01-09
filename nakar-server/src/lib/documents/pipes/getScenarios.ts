import { DBScenario } from '../types/DBScenario';

export async function getScenarios(
  scenarioGroupId: string,
): Promise<DBScenario[]> {
  return await strapi.documents('api::scenario.scenario').findMany({
    status: 'published',
    sort: 'title:asc',
    populate: {
      cover: {},
      scenarioGroup: {
        populate: {
          database: {
            populate: {
              graphDisplayConfiguration: {
                populate: {
                  nodeDisplayConfigurations: {},
                },
              },
            },
          },
          graphDisplayConfiguration: {
            populate: {
              nodeDisplayConfigurations: {},
            },
          },
        },
      },
      graphDisplayConfiguration: {
        populate: {
          nodeDisplayConfigurations: {},
        },
      },
    },
    filters: {
      scenarioGroup: {
        documentId: {
          $eq: scenarioGroupId,
        },
      },
    },
  });
}
