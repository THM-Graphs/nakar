import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../database/DatabaseService';

export async function databaseBelongsToCanvas(
  database: Result<'api::database-connection.database-connection'>,
  canvas: Result<'api::canvas.canvas'>,
  databaseService: DatabaseService,
): Promise<boolean> {
  const project: Result<'api::project.project'> =
    await databaseService.getProjectOfCanvas(canvas);
  const projectOfDatabase: Result<'api::project.project'> =
    await databaseService.getProjectOfDatabase(database);
  return project.documentId === projectOfDatabase.documentId;
}
