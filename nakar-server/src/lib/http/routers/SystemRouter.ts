import { HTTPTools } from '../HTTPTools';
import { Router } from 'express';
import { SchemaVersion } from '../../../../src-gen/schema';
import { getConfig } from '../../config/getConfig';

export class SystemRouter {
  public constructor(private readonly _httpTools: HTTPTools) {}

  public register(): Router {
    const router: Router = Router();

    router.get('/version', this._httpTools.handle(this._getVersion.bind(this)));

    return router;
  }

  private _getVersion(): SchemaVersion {
    return {
      version: getConfig().version,
    };
  }
}
