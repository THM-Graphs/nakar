import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../database/DatabaseService';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';

export async function userCanSeeProject(
  user: Result<'plugin::users-permissions.user'> | null,
  project: Result<'api::v2-project.v2-project'>,
  database: DatabaseService,
): Promise<boolean> {
  const logger: Logger = createChildLogger('userCanSeeProject');

  if (user == null) {
    logger.warn(
      `User not logged in wants to access project ${project.title ?? project.documentId}. Not allowed.`,
    );
    return false;
  }

  const owner: Result<'plugin::users-permissions.user'> | null =
    await database.getOwnerOfProject(project);
  if (owner != null && owner.documentId === user.documentId) {
    return true;
  }

  const collaboratores: Result<'plugin::users-permissions.user'>[] =
    await database.getCollaboratorsOfProject(project);
  for (const collaborator of collaboratores) {
    if (collaborator.documentId === user.documentId) {
      return true;
    }
  }

  logger.warn(
    `User ${user.username ?? user.documentId} wants to access project ${project.title ?? project.documentId}. Not allowed.`,
  );
  return false;
}
