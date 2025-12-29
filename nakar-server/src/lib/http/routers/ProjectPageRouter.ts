import { HTTPTools } from '../HTTPTools';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Request, Router } from 'express';
import { SchemaProjectPage } from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeProject } from '../../policies/userCanSeeProject';

export class ProjectPageRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _database: DatabaseService,
  ) {}

  public register(): Router {
    const router: Router = Router();
    router.get('/:id', this._httpTools.handle(this._getProjectPage.bind(this)));
    return router;
  }

  private async _getProjectPage(req: Request): Promise<SchemaProjectPage> {
    const id: string = this._httpTools.getPathParameter(req, 'id');
    const project: Result<'api::v2-project.v2-project'> | null =
      await this._database.getProjectOrNull(id);

    if (project == null) {
      throw new NotFound();
    }

    const allowed: boolean = await userCanSeeProject(
      req.nakar.possibleUser,
      project,
      this._database,
    );
    if (!allowed) {
      throw new NotFound();
    }

    return await this._schemaFactory.createSchemaProjectPage(project);
  }
}
