import type { DatabaseService } from '../database/DatabaseService';
import type { Modules } from '@strapi/types';

export async function databaseBelongsToCanvas(
  database: Modules.Documents.Result<'api::database-connection.database-connection'>,
  canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  databaseService: DatabaseService,
): Promise<boolean> {
  const project: Modules.Documents.Result<'api::project.project'> =
    await databaseService.getProjectOfCanvas(canvas);
  const projectOfDatabase: Modules.Documents.Result<'api::project.project'> =
    await databaseService.getProjectOfDatabase(database);
  return project.documentId === projectOfDatabase.documentId;
}
