import { HTTPTools } from '../HTTPTools';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Request, Router } from 'express';
import {
  operations,
  SchemaStartPage,
  SchemaStartPageProject,
  SchemaStartPageRoom,
} from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../../logger/createChildLogger';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeRoom } from '../../policies/userCanSeeRoom';

export class StartPageRouter {
  private readonly _logger: Logger = createChildLogger(this);

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _database: DatabaseService,
  ) {}

  public register(): Router {
    const router: Router = Router();
    router.get('/', this._httpTools.handle(this._getStartPage.bind(this)));
    return router;
  }

  private async _getStartPage(req: Request): Promise<SchemaStartPage> {
    type QueryData = operations['getStartPage']['parameters']['query'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const query: QueryData = req.query as unknown as QueryData;
    const recentRoomIds: string[] = [...query.recentRoomIds];
    const recentRooms: Result<'api::v2-room.v2-room'>[] = [];
    for (const recentRoomId of recentRoomIds) {
      try {
        const room: Result<'api::v2-room.v2-room'> =
          await this._database.getRoom(recentRoomId);
        const allowed: boolean = await userCanSeeRoom(
          req.nakar.possibleUser,
          room,
          this._database,
        );
        if (allowed) {
          recentRooms.push(room);
        }
      } catch (error) {
        this._logger.error(error);
      }
    }

    const myProjects: Result<'api::v2-project.v2-project'>[] = req.nakar
      .possibleUser
      ? await this._database.getProjectsOfUser(req.nakar.possibleUser)
      : [];

    const collaborationProjects: Result<'api::v2-project.v2-project'>[] = req
      .nakar.possibleUser
      ? await this._database.getCollaborationProjectsOfUser(
          req.nakar.possibleUser,
        )
      : [];

    const publicRooms: Result<'api::v2-room.v2-room'>[] =
      await this._database.getPublicRooms();

    return {
      myProjects: (
        await Promise.all(
          myProjects.map(
            async (
              project: Result<'api::v2-project.v2-project'>,
            ): Promise<SchemaStartPageProject> =>
              await this._schemaFactory.createSchemaStartPageProject(project),
          ),
        )
      ).toSorted(
        (a: SchemaStartPageProject, b: SchemaStartPageProject): number =>
          a.title.localeCompare(b.title),
      ),
      collaborationProjects: (
        await Promise.all(
          collaborationProjects.map(
            async (
              project: Result<'api::v2-project.v2-project'>,
            ): Promise<SchemaStartPageProject> =>
              await this._schemaFactory.createSchemaStartPageProject(project),
          ),
        )
      ).toSorted(
        (a: SchemaStartPageProject, b: SchemaStartPageProject): number =>
          a.title.localeCompare(b.title),
      ),
      publicRooms: (
        await Promise.all(
          publicRooms.map(
            async (
              room: Result<'api::v2-room.v2-room'>,
            ): Promise<SchemaStartPageRoom> => {
              return await this._schemaFactory.createSchemaStartPageRoom(room);
            },
          ),
        )
      ).toSorted((a: SchemaStartPageRoom, b: SchemaStartPageRoom): number =>
        a.projectTitle.localeCompare(b.projectTitle),
      ),
      recentRooms: await Promise.all(
        recentRooms.map(
          async (
            room: Result<'api::v2-room.v2-room'>,
          ): Promise<SchemaStartPageRoom> => {
            return await this._schemaFactory.createSchemaStartPageRoom(room);
          },
        ),
      ),
    };
  }
}
