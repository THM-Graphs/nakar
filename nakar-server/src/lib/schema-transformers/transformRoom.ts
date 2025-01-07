import { SchemaGetRoom } from '../../../src-gen/schema';
import { DBRoom } from '../strapi-db/types/DBRoom';

export function transformRoom(room: DBRoom): SchemaGetRoom {
  return {
    id: room.documentId,
    title: room.title ?? '',
  };
}
