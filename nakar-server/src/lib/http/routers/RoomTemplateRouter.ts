import { HTTPTools } from '../HTTPTools';
import { DatabaseService } from '../../database/DatabaseService';
import { SchemaDTOFactory } from '../SchemaDTOFactory';
import { NextFunction, type Request, Response, Router } from 'express';
import type {
  SchemaRoomTemplate,
  SchemaRoomTemplates,
} from '../../../../src-gen/schema';
import { GetTemplateDBDTO } from '../../database/dto/GetTemplateDBDTO';
import { NotFound } from 'http-errors';

export class RoomTemplateRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _databaseService: DatabaseService,
    private readonly _schemaDTOFactory: SchemaDTOFactory,
  ) {}

  public register(): Router {
    const router: Router = Router();

    router.get('/', this._httpTools.handle(this._getRoomTemplates.bind(this)));
    router.use('/:id', this._assertRoomTemplate.bind(this));
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
          return this._schemaDTOFactory.createSchemaRoomTemplate(roomTemplate);
        },
      ),
    };
  }

  private async _assertRoomTemplate(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id: string = this._httpTools.getPathParameter(req, 'id');
      const dbResult: GetTemplateDBDTO | null =
        await this._databaseService.getRoomTemplate(id);
      if (dbResult == null) {
        throw new NotFound(`Template ${id} not found.`);
      }
      req.nakarRoomTemplate = dbResult;
      next();
    } catch (error: unknown) {
      this._httpTools.handleUnknownError(res, error);
    }
  }

  private _getRoomTemplate(req: Request): SchemaRoomTemplate {
    return this._schemaDTOFactory.createSchemaRoomTemplate(
      req.nakarRoomTemplate,
    );
  }
}
