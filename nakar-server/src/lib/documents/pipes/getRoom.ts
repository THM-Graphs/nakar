import { DBRoom } from '../types/DBRoom';

export async function getRoom(roomId: string): Promise<DBRoom | null> {
  return await strapi.documents('api::room.room').findOne({
    status: 'published',
    documentId: roomId,
  });
}
