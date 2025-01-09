import { DBDatabase } from '../types/DBDatabase';

export async function getDatabases(): Promise<DBDatabase[]> {
  return await strapi.documents('api::database.database').findMany({
    status: 'published',
    sort: 'title:asc',
    populate: {
      graphDisplayConfiguration: {
        populate: {
          nodeDisplayConfigurations: {},
        },
      },
    },
  });
}
