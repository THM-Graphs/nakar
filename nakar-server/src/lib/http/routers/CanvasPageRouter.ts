import { HTTPTools } from '../HTTPTools';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';
import { Request, Router } from 'express';
import { SchemaCanvasPage } from '../../../../src-gen/schema';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { NotFound } from 'http-errors';
import { DatabaseService } from '../../database/DatabaseService';
import { userCanSeeRoom } from '../../policies/userCanSeeRoom';

export class CanvasPageRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _schemaFactory: SchemaFactoryService,
    private readonly _database: DatabaseService,
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

    return {
      canvas: await this._schemaFactory.createSchemaCanvasPreview(canvas),
      room: await this._schemaFactory.createSchemaRoom(room),
      scenarios: await this._schemaFactory.createGetScenariosResult(room),
    };
  }
}
