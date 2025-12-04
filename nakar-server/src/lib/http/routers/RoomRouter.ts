import { HTTPTools } from '../HTTPTools';
import { ConfigService } from '../../config/ConfigService';
import {
  type NextFunction,
  type Request,
  type Response,
  Router,
} from 'express';
import type {
  operations,
  SchemaRoom,
  SchemaRooms,
} from '../../../../src-gen/schema';
import { GetRoomDBDTO } from '../../database/dto/GetRoomDBDTO';
import { DatabaseService } from '../../database/DatabaseService';
import type { GetTemplateDBDTO } from '../../database/dto/GetTemplateDBDTO';
import { NotFound } from 'http-errors';
import { ScenariosRouter } from './ScenariosRouter';
import { GraphRouter } from './GraphRouter';
import { RoomService } from '../../room/RoomService';
import { LoggerService } from '../../logger/LoggerService';
import { MediaService } from '../../media/MediaService';
import { ProfilerService } from '../../profiler/ProfilerService';
import { NotesRouter } from './NotesRouter';
import { ActionsRouter } from './ActionsRouter';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';

export class RoomRouter {
  private readonly _scenariosRouter: ScenariosRouter;
  private readonly _graphRouter: GraphRouter;
  private readonly _notesRouter: NotesRouter;
  private readonly _actionsRouter: ActionsRouter;

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _roomService: RoomService,
    private readonly _logger: LoggerService,
    private readonly _config: ConfigService,
    private readonly _media: MediaService,
    private readonly _profiler: ProfilerService,
  ) {
    this._scenariosRouter = new ScenariosRouter(
      _httpTools,
      _databaseService,
      _schemaFactory,
    );
    this._graphRouter = new GraphRouter(
      _httpTools,
      _databaseService,
      _roomService,
      _logger,
      _config,
      _media,
      _profiler,
      _schemaFactory,
    );
    this._notesRouter = new NotesRouter(_httpTools, _databaseService, _logger);
    this._actionsRouter = new ActionsRouter(_httpTools, _roomService);
  }

  public register(): Router {
    const router: Router = Router();

    router.get(
      '/',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._getRooms.bind(this)),
    );
    router.post('/', this._httpTools.handle(this._postRoom.bind(this)));
    router.use('/:id', this._assertRoom.bind(this));
    router.get('/:id', this._httpTools.handle(this._getRoom.bind(this)));
    router.use('/:id/scenarios', this._scenariosRouter.register());
    router.use('/:id/graph', this._graphRouter.register());
    router.use('/:id/note', this._notesRouter.register());
    router.use('/:id/actions', this._actionsRouter.register());

    return router;
  }

  private async _assertRoom(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const room: GetRoomDBDTO = await this._httpTools.assertRoom(req);
      req.nakarRoom = room;
      next();
    } catch (error) {
      this._httpTools.handleUnknownError(res, error);
    }
  }

  private async _getRooms(): Promise<SchemaRooms> {
    const dbResult: GetRoomDBDTO[] = await this._databaseService.getRooms();
    return {
      rooms: await Promise.all(
        dbResult.map(async (room: GetRoomDBDTO): Promise<SchemaRoom> => {
          return this._schemaFactory.createSchemaRoom(
            room,
            await this._httpTools.getScenarioOfRoom(room),
          );
        }),
      ),
    };
  }

  private async _postRoom(req: Request): Promise<SchemaRoom> {
    type Body =
      operations['createRoom']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const body: Body = req.body as Body;
    const template: GetTemplateDBDTO | null =
      await this._databaseService.getRoomTemplate(body.templateId);
    if (template == null) {
      throw new NotFound(`Template ${body.templateId} not found.`);
    }

    const room: GetRoomDBDTO = await this._databaseService.createRoom(template);
    const result: SchemaRoom = this._schemaFactory.createSchemaRoom(
      room,
      await this._httpTools.getScenarioOfRoom(room),
    );
    return result;
  }

  private async _getRoom(req: Request): Promise<SchemaRoom> {
    const dbResult: GetRoomDBDTO = req.nakarRoom;
    return this._schemaFactory.createSchemaRoom(
      dbResult,
      await this._httpTools.getScenarioOfRoom(dbResult),
    );
  }
}
