import { DBRoom } from '../types/DBRoom';

export async function getRooms(): Promise<DBRoom[]> {
  return await strapi.documents('api::room.room').findMany({
    status: 'published',
    sort: 'title:asc',
  });
}
