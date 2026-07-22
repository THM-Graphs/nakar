import type { DatabaseService } from '../database/DatabaseService';
import type { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import type { Modules } from '@strapi/types';

export async function userCanSeeAndEditProject(
  user: Modules.Documents.Result<'plugin::users-permissions.user'> | null,
  project: Modules.Documents.Result<'api::project.project'>,
  database: DatabaseService,
): Promise<boolean> {
  const logger: Logger = createChildLogger('userCanSeeProject');

  if (user == null) {
    logger.warn(
      `User not logged in wants to access project ${project.title ?? project.documentId}. Not allowed.`,
    );
    return false;
  }

  const owner: Modules.Documents.Result<'plugin::users-permissions.user'> | null =
    await database.getOwnerOfProject(project);
  if (owner?.documentId === user.documentId) {
    return true;
  }

  const collaborators: Modules.Documents.Result<'plugin::users-permissions.user'>[] =
    await database.getCollaboratorsOfProject(project);
  for (const collaborator of collaborators) {
    if (collaborator.documentId === user.documentId) {
      return true;
    }
  }

  logger.warn(
    `User ${user.username ?? user.documentId} wants to access project ${project.title ?? project.documentId}. Not allowed.`,
  );
  return false;
}
