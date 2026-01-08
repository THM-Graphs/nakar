import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { userCanSeeProject } from './userCanSeeProject';

export async function userCanSeeCanvas(
  user: Result<'plugin::users-permissions.user'> | null,
  canvas: Result<'api::v2-canvas.v2-canvas'>,
  database: DatabaseService,
): Promise<boolean> {
  const logger: Logger = createChildLogger('userCanSeeRoom');

  const room: Result<'api::v2-room.v2-room'> =
    await database.getRoomOfCanvas(canvas);

  if (room.visibility === 'public') {
    return true;
  }
  if (room.visibility === 'unlisted') {
    return true;
  }

  const project: Result<'api::v2-project.v2-project'> =
    await database.getProjectOfRoom(room);
  if (await userCanSeeProject(user, project, database)) {
    return true;
  }

  logger.warn(
    `User ${user?.username ?? user?.documentId ?? 'anonym'} wants to access room ${room.title ?? room.documentId}. Not allowed.`,
  );
  return false;
}
