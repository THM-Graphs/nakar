import { HTTPTools } from '../HTTPTools';
import { type Request, Router } from 'express';
import type { SchemaGetScenariosResult } from '../../../../src-gen/schema';
import { SchemaFactoryService } from '../../schema/SchemaFactoryService';

export class ScenariosRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {}

  public register(): Router {
    const router: Router = Router();
    router.get('/', this._httpTools.handle(this._getScenarios.bind(this)));
    return router;
  }

  private async _getScenarios(req: Request): Promise<SchemaGetScenariosResult> {
    return await this._schemaFactory.createGetScenariosResult(req.nakar.room);
  }
}
