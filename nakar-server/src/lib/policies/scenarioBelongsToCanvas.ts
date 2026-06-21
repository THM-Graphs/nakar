import type { Result } from '@strapi/types/dist/modules/documents/result';
import type { DatabaseService } from '../database/DatabaseService';

export async function scenarioBelongsToCanvas(
  scenario: Result<'api::scenario.scenario'>,
  canvas: Result<'api::canvas.canvas'>,
  databaseService: DatabaseService,
): Promise<boolean> {
  const project: Result<'api::project.project'> =
    await databaseService.getProjectOfCanvas(canvas);
  const projectOfScenario: Result<'api::project.project'> =
    await databaseService.getProjectOfScenario(scenario);
  return project.documentId === projectOfScenario.documentId;
}
