import { DBScenarioGroup } from '../types/DBScenarioGroup';

export async function getScenarioGroups(
  databaseId: string,
): Promise<DBScenarioGroup[]> {
  return await strapi.documents('api::scenario-group.scenario-group').findMany({
    status: 'published',
    sort: 'title:asc',
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
    filters: {
      database: {
        documentId: {
          $eq: databaseId,
        },
      },
    },
  });
}
