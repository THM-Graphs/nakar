import type { DatabaseService } from '../database/DatabaseService';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { userCanSeeAndEditProject } from './userCanSeeAndEditProject';
import type { Modules } from '@strapi/types';

export async function userCanSeeAndJoinRoom(
  user: Modules.Documents.Result<'plugin::users-permissions.user'> | null,
  room: Modules.Documents.Result<'api::room.room'>,
  database: DatabaseService,
): Promise<boolean> {
  const logger: Logger = createChildLogger('userCanSeeRoom');

  if (room.visibility === 'public') {
    return true;
  }
  if (room.visibility === 'unlisted') {
    return true;
  }

  const project: Modules.Documents.Result<'api::project.project'> =
    await database.getProjectOfRoom(room);
  if (await userCanSeeAndEditProject(user, project, database)) {
    return true;
  }

  logger.warn(
    `User ${user?.username ?? user?.documentId ?? 'anonym'} wants to access room ${room.title ?? room.documentId}. Not allowed.`,
  );
  return false;
}
