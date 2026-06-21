import type { Result } from '@strapi/types/dist/modules/documents/result';
import type { DatabaseService } from '../database/DatabaseService';

export async function databaseBelongsToProject(
  database: Result<'api::database-connection.database-connection'>,
  project: Result<'api::project.project'>,
  databaseService: DatabaseService,
): Promise<boolean> {
  const projectOfDatabase: Result<'api::project.project'> =
    await databaseService.getProjectOfDatabase(database);
  return project.documentId === projectOfDatabase.documentId;
}
