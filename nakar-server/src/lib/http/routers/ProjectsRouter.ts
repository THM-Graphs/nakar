import { HTTPTools } from '../HTTPTools';
import { Request, Router } from 'express';
import {
  SchemaProject,
  SchemaProjectPreview,
  SchemaProjects,
} from '../../../../src-gen/schema';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { NotFound } from 'http-errors';
import { LoggerService } from '../../logger/LoggerService';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { DatabaseService } from '../../database/DatabaseService';

export class ProjectsRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.get(
      '/',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._getProjects.bind(this)),
    );
    router.use(
      '/:id',
      this._httpTools.assertLoggedIn,
      this._httpTools.handleMiddleware(this._assertProject.bind(this)),
    );
    router.get('/:id', this._httpTools.handle(this._getProject.bind(this)));

    return router;
  }

  private async _assertProject(req: Request): Promise<void> {
    try {
      const id: string = this._httpTools.getPathParameter(req, 'id');
      const project: Result<'api::v2-project.v2-project'> | null = await strapi
        .documents('api::v2-project.v2-project')
        .findOne({
          documentId: id,
        });

      if (project == null) {
        throw new NotFound();
      }

      const owner: Result<'plugin::users-permissions.user'> | null =
        await this._database.getOwnerOfProject(project);
      const collaborators: Result<'plugin::users-permissions.user'>[] =
        await this._database.getCollaboratorsOfProject(project);

      if (
        owner?.documentId !== req.nakar.user.documentId &&
        !collaborators
          .map(
            (c: Result<'plugin::users-permissions.user'>): string =>
              c.documentId,
          )
          .includes(req.nakar.user.documentId)
      ) {
        throw new NotFound();
      }

      req.nakar = {
        ...req.nakar,
        project: project,
      };
    } catch (error) {
      this._logger.error(this, error);
      throw new NotFound();
    }
  }

  private async _getProjects(req: Request): Promise<SchemaProjects> {
    const myProjects: Result<'api::v2-project.v2-project'>[] =
      await this._database.getProjectsOfUser(req.nakar.user);

    const collaborationProjects: Result<'api::v2-project.v2-project'>[] =
      await this._database.getCollaborationProjectsOfUser(req.nakar.user);

    return {
      myProjects: await Promise.all(
        myProjects.map(
          async (
            project: Result<'api::v2-project.v2-project'>,
          ): Promise<SchemaProjectPreview> => {
            return await this._schemaFactory.createSchemaProjectPreview(
              project,
              req.nakar.user,
            );
          },
        ),
      ),
      collaborationProjects: await Promise.all(
        collaborationProjects.map(
          async (
            project: Result<'api::v2-project.v2-project'>,
          ): Promise<SchemaProjectPreview> => {
            return await this._schemaFactory.createSchemaProjectPreview(
              project,
              req.nakar.user,
            );
          },
        ),
      ),
    };
  }

  private async _getProject(req: Request): Promise<SchemaProject> {
    const project: Result<'api::v2-project.v2-project'> = req.nakar.project;
    const result: SchemaProject =
      await this._schemaFactory.createSchemaProject(project);
    return result;
  }
}
