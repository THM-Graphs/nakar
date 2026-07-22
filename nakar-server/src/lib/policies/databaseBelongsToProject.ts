import type { DatabaseService } from '../database/DatabaseService';
import type { Modules } from '@strapi/types';

export async function databaseBelongsToProject(
  database: Modules.Documents.Result<'api::database-connection.database-connection'>,
  project: Modules.Documents.Result<'api::project.project'>,
  databaseService: DatabaseService,
): Promise<boolean> {
  const projectOfDatabase: Modules.Documents.Result<'api::project.project'> =
    await databaseService.getProjectOfDatabase(database);
  return project.documentId === projectOfDatabase.documentId;
}
