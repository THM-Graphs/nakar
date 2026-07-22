import type { DatabaseService } from '../database/DatabaseService';
import { userCanSeeAndJoinRoom } from './userCanSeeAndJoinRoom';
import type { Modules } from '@strapi/types';

export async function userCanSeeAndJoinCanvas(
  user: Modules.Documents.Result<'plugin::users-permissions.user'> | null,
  canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  database: DatabaseService,
): Promise<boolean> {
  const room: Modules.Documents.Result<'api::room.room'> =
    await database.getRoomOfCanvas(canvas);
  return await userCanSeeAndJoinRoom(user, room, database);
}
