import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { type Request, Router } from 'express';
import type {
  SchemaRoomTemplate,
  SchemaRoomTemplates,
} from '../../../../src-gen/schema';
import { GetTemplateDBDTO } from '../../database/dto/GetTemplateDBDTO';
import { NotFound } from 'http-errors';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';

export class RoomTemplateRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.get('/', this._httpTools.handle(this._getRoomTemplates.bind(this)));
    router.use(
      '/:id',
      this._httpTools.handleMiddleware(this._assertRoomTemplate.bind(this)),
    );
    router.get(
      '/:id',
      this._httpTools.handle(this._getRoomTemplate.bind(this)),
    );

    return router;
  }

  private async _getRoomTemplates(): Promise<SchemaRoomTemplates> {
    const dbResult: GetTemplateDBDTO[] =
      await this._databaseService.getRoomTemplates();
    return {
      roomTemplates: dbResult.map(
        (roomTemplate: GetTemplateDBDTO): SchemaRoomTemplate => {
          return this._schemaFactory.createSchemaRoomTemplate(roomTemplate);
        },
      ),
    };
  }

  private async _assertRoomTemplate(req: Request): Promise<void> {
    const id: string = this._httpTools.getPathParameter(req, 'id');
    const roomTemplate: GetTemplateDBDTO | null =
      await this._databaseService.getRoomTemplate(id);
    if (roomTemplate == null) {
      throw new NotFound(`Template ${id} not found.`);
    }
    req.nakar = {
      ...req.nakar,
      roomTemplate: roomTemplate,
    };
  }

  private _getRoomTemplate(req: Request): SchemaRoomTemplate {
    return this._schemaFactory.createSchemaRoomTemplate(req.nakar.roomTemplate);
  }
}
