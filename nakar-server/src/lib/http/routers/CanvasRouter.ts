import { HTTPTools } from '../HTTPTools';
import { Request, Router } from 'express';
import { GraphRouter } from './GraphRouter';
import { DatabaseService } from '../../database/DatabaseService';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { ActionsRouter } from './ActionsRouter';
import { CanvasService } from '../../room/CanvasService';
import { operations } from '../../../../src-gen/schema';
import { Range } from '../../range/Range';
import { userCanSeeRoom } from '../../policies/userCanSeeRoom';
import { NotFound } from 'http-errors';

export class CanvasRouter {
  private readonly _graphRouter: GraphRouter;
  private readonly _actionsRouter: ActionsRouter;

  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    schemaFactory: SchemaFactoryService,
    canvasService: CanvasService,
  ) {
    this._graphRouter = new GraphRouter(
      _httpTools,
      _databaseService,
      schemaFactory,
    );
    this._actionsRouter = new ActionsRouter(_httpTools, canvasService);
  }

  public register(): Router {
    const router: Router = Router();

    router.use(
      '/:id',
      this._httpTools.handleMiddleware(this._assertCanvas.bind(this)),
    );
    router.use('/:id/graph', this._graphRouter.register());
    router.use('/:id/actions', this._actionsRouter.register());
    router.put('/:id', this._httpTools.handle(this._updateCanvas.bind(this)));

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

  private async _updateCanvas(req: Request): Promise<void> {
    type Body =
      operations['setCanvasData']['requestBody']['content']['application/json'];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    const body: Body = req.body as Body;

    if (body.compressRelationshipsWidthFactor != null) {
      await this._databaseService.setCanvasCompressRelationshipsWidthFactor(
        req.nakar.canvas,
        Range.clamp(body.compressRelationshipsWidthFactor, 1, 1000),
      );
    }
    if (body.growNodesBasedOnDegree != null) {
      await this._databaseService.setGrowNodesBasedOnDegree(
        req.nakar.canvas,
        body.growNodesBasedOnDegree,
      );
    }
    if (body.growNodesBasedOnDegreeFactor != null) {
      await this._databaseService.setGrowNodesBasedOnDegreeFactor(
        req.nakar.canvas,
        Range.clamp(body.growNodesBasedOnDegreeFactor, 1, 100),
      );
    }
  }
}
