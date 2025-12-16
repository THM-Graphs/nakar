import { HTTPTools } from '../HTTPTools';
import { type Request, Router } from 'express';
import type { SchemaRoom, SchemaRooms } from '../../../../src-gen/schema';
import { DatabaseService } from '../../database/DatabaseService';
import { NotFound } from 'http-errors';
import { ScenariosRouter } from './ScenariosRouter';
import { GraphRouter } from './GraphRouter';
import { CanvasService } from '../../room/CanvasService';
import { LoggerService } from '../../logger/LoggerService';
import { NotesRouter } from './NotesRouter';
import { ActionsRouter } from './ActionsRouter';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Result } from '@strapi/types/dist/modules/documents/result';

export class RoomRouter {
  private readonly _scenariosRouter: ScenariosRouter;

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    logger: LoggerService,
    roomService: CanvasService,
  ) {
    this._scenariosRouter = new ScenariosRouter(
      _httpTools,
      _databaseService,
      _schemaFactory,
    );
  }

  public register(): Router {
    const router: Router = Router();

    router.get('/', this._httpTools.handle(this._getRooms.bind(this)));
    router.use(
      '/:id',
      this._httpTools.handleMiddleware(this._assertRoom.bind(this)),
    );
    router.get('/:id', this._httpTools.handle(this._getRoom.bind(this)));
    router.use('/:id/scenarios', this._scenariosRouter.register());

    return router;
  }

  private async _assertRoom(req: Request): Promise<void> {
    const id: string = this._httpTools.getPathParameter(req, 'id');
    const room: Result<'api::v2-room.v2-room'> | null =
      await this._databaseService.getRoom(id);
    if (room == null) {
      throw new NotFound('Room not found.');
    }
    const project: Result<'api::v2-project.v2-project'> | null =
      await this._databaseService.getProjectOfRoom(room);
    if (project == null) {
      throw new NotFound('Project not found.');
    }
    req.nakar = {
      ...req.nakar,
      room: room,
      project: project,
    };
  }

  private async _getRooms(): Promise<SchemaRooms> {
    const dbResult: Result<'api::v2-room.v2-room'>[] =
      await this._databaseService.getPublicRooms();
    return {
      rooms: await Promise.all(
        dbResult.map(
          async (room: Result<'api::v2-room.v2-room'>): Promise<SchemaRoom> => {
            return await this._schemaFactory.createSchemaRoom(room);
          },
        ),
      ),
    };
  }

  private async _getRoom(req: Request): Promise<SchemaRoom> {
    const dbResult: Result<'api::v2-room.v2-room'> = req.nakar.room;
    return await this._schemaFactory.createSchemaRoom(dbResult);
  }
}
