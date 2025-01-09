import { DBScenario } from '../types/DBScenario';

export async function getScenario(
  scenarioId: string,
): Promise<DBScenario | null> {
  return await strapi.documents('api::scenario.scenario').findOne({
    status: 'published',
    documentId: scenarioId,
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
  });
}
