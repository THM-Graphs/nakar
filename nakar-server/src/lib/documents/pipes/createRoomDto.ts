import { DBRoom } from '../types/DBRoom';
import { SchemaGetRoom } from '../../../../src-gen/schema';

export function createRoomDto(room: DBRoom): SchemaGetRoom {
  return {
    id: room.documentId,
    title: room.title ?? null,
  };
}
