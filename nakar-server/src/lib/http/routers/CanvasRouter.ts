import { HTTPTools } from '../HTTPTools';
import { Request, Router } from 'express';
import { DatabaseService } from '../../database/DatabaseService';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { ActionsRouter } from './ActionsRouter';
import { CanvasService } from '../../room/CanvasService';
import { userCanSeeRoom } from '../../policies/userCanSeeRoom';
import { NotFound } from 'http-errors';

export class CanvasRouter {
  private readonly _actionsRouter: ActionsRouter;

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    canvasService: CanvasService,
  ) {
    this._actionsRouter = new ActionsRouter(_httpTools, canvasService);
  }

  public register(): Router {
    const router: Router = Router();

    router.use(
      '/:id',
      this._httpTools.handleMiddleware(this._assertCanvas.bind(this)),
    );
    router.use('/:id/actions', this._actionsRouter.register());

    return router;
  }

  private async _assertCanvas(req: Request): Promise<void> {
    const id: string = this._httpTools.getPathParameter(req, 'id');
    const canvas: Result<'api::v2-canvas.v2-canvas'> =
      await this._databaseService.getCanvas(id);

    const room: Result<'api::v2-room.v2-room'> =
      await this._databaseService.getRoomOfCanvas(canvas);

    const allowed: boolean = await userCanSeeRoom(
      req.nakar.possibleUser,
      room,
      this._databaseService,
    );
    if (!allowed) {
      throw new NotFound();
    }

    const project: Result<'api::v2-project.v2-project'> =
      await this._databaseService.getProjectOfRoom(room);

    req.nakar = {
      ...req.nakar,
      project: project,
      room: room,
      canvas: canvas,
    };
  }
}
