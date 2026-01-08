import { HTTPTools } from '../HTTPTools';
import { Request, Router } from 'express';
import { SchemaRoom } from '../../../../src-gen/schema';
import { DatabaseService } from '../../database/DatabaseService';
import { NotFound } from 'http-errors';
import { ScenariosRouter } from './ScenariosRouter';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Result } from '@strapi/types/dist/modules/documents/result';

export class RoomRouter {
  private readonly _scenariosRouter: ScenariosRouter;

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {
    this._scenariosRouter = new ScenariosRouter(_httpTools, _schemaFactory);
  }

  public register(): Router {
    const router: Router = Router();

    router.use(
      '/:id',
      this._httpTools.handleMiddleware(this._assertRoom.bind(this)),
    );
    router.get('/:id', this._httpTools.handle(this._getRoom.bind(this)));
    router.use('/:id/scenarios', this._scenariosRouter.register());

    return router;
  }

  private async _assertRoom(req: Request): Promise<void> {
    try {
      const id: string = this._httpTools.getPathParameter(req, 'id');
      const room: Result<'api::v2-room.v2-room'> | null =
        await this._databaseService.getRoom(id);

      const project: Result<'api::v2-project.v2-project'> | null =
        await this._databaseService.getProjectOfRoom(room);

      req.nakar = {
        ...req.nakar,
        room: room,
        project: project,
      };
    } catch {
      throw new NotFound();
    }
  }

  private async _getRoom(req: Request): Promise<SchemaRoom> {
    const dbResult: Result<'api::v2-room.v2-room'> = req.nakar.room;
    return await this._schemaFactory.createSchemaRoom(dbResult);
  }
}
