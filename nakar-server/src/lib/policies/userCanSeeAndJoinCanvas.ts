import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../database/DatabaseService';
import { userCanSeeAndJoinRoom } from './userCanSeeAndJoinRoom';

export async function userCanSeeAndJoinCanvas(
  user: Result<'plugin::users-permissions.user'> | null,
  canvas: Result<'api::canvas.canvas'>,
  database: DatabaseService,
): Promise<boolean> {
  const room: Result<'api::room.room'> = await database.getRoomOfCanvas(canvas);
  return await userCanSeeAndJoinRoom(user, room, database);
}
