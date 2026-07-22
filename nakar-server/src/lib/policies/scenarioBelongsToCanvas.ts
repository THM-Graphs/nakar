import type { DatabaseService } from '../database/DatabaseService';
import type { Modules } from '@strapi/types';

export async function scenarioBelongsToCanvas(
  scenario: Modules.Documents.Result<'api::scenario.scenario'>,
  canvas: Modules.Documents.Result<'api::canvas.canvas'>,
  databaseService: DatabaseService,
): Promise<boolean> {
  const project: Modules.Documents.Result<'api::project.project'> =
    await databaseService.getProjectOfCanvas(canvas);
  const projectOfScenario: Modules.Documents.Result<'api::project.project'> =
    await databaseService.getProjectOfScenario(scenario);
  return project.documentId === projectOfScenario.documentId;
}
