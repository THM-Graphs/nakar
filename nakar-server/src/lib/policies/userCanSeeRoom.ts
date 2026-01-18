import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { userCanSeeProject } from './userCanSeeProject';

export async function userCanSeeRoom(
  user: Result<'plugin::users-permissions.user'> | null,
  room: Result<'api::room.room'>,
  database: DatabaseService,
): Promise<boolean> {
  const logger: Logger = createChildLogger('userCanSeeRoom');

  if (room.visibility === 'public') {
    return true;
  }
  if (room.visibility === 'unlisted') {
    return true;
  }

  const project: Result<'api::project.project'> =
    await database.getProjectOfRoom(room);
  if (await userCanSeeProject(user, project, database)) {
    return true;
  }

  logger.warn(
    `User ${user?.username ?? user?.documentId ?? 'anonym'} wants to access room ${room.title ?? room.documentId}. Not allowed.`,
  );
  return false;
}
