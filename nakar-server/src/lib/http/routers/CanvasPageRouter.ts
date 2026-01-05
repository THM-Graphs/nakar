import { HTTPTools } from '../HTTPTools';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Request, Router } from 'express';
import { SchemaCanvasPage } from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeRoom } from '../../policies/userCanSeeRoom';
import { CanvasService } from '../../room/CanvasService';
import { IndexedNoteCollection } from '../../database/IndexedNoteCollection';
import { LiveCanvas } from '../../room/LiveCanvas';
import { CanvasViewSettings } from '../../room/graph/CanvasViewSettings';

export class CanvasPageRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _database: DatabaseService,
    private readonly _canvasService: CanvasService,
  ) {}

  public register(): Router {
    const router: Router = Router();
    router.get('/:id', this._httpTools.handle(this._getCanvasPage.bind(this)));
    return router;
  }

  private async _getCanvasPage(req: Request): Promise<SchemaCanvasPage> {
    const id: string = this._httpTools.getPathParameter(req, 'id');
    const canvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await this._database.getCanvasOrNull(id);

    if (canvas == null) {
      throw new NotFound();
    }

    const room: Result<'api::v2-room.v2-room'> =
      await this._database.getRoomOfCanvas(canvas);

    const allowed: boolean = await userCanSeeRoom(
      req.nakar.possibleUser,
      room,
      this._database,
    );
    if (!allowed) {
      throw new NotFound();
    }

    const project: Result<'api::v2-project.v2-project'> =
      await this._database.getProjectOfRoom(room);

    await this._canvasService.startCanvas(canvas);

    const liveCanvas: LiveCanvas = this._canvasService.getCanvas(canvas);
    const notes: IndexedNoteCollection = await this._database.getNotes({
      project: project,
      graph: liveCanvas.getGraph(),
    });

    return {
      canvas: await this._schemaFactory.createSchemaCanvasPreview(canvas),
      room: await this._schemaFactory.createSchemaRoom(room),
      graph: await this._schemaFactory.createSchemaGraph(
        liveCanvas.getGraph(),
        notes,
        liveCanvas.getUndoInfo(),
        CanvasViewSettings.fromDB(canvas),
      ),
      scenarios: await this._schemaFactory.createGetScenariosResult(room),
    };
  }
}
