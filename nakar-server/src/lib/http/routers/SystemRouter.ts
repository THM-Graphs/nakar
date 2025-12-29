import { HTTPTools } from '../HTTPTools';
import { Router } from 'express';
import type { SchemaVersion } from '../../../../src-gen/schema';
import { FileStream } from '../../fs/FileStream';
import { NotImplemented } from 'http-errors';
import { getConfig } from '../../config/getConfig';

export class SystemRouter {
  public constructor(private readonly _httpTools: HTTPTools) {}

  public register(): Router {
    const router: Router = Router();

    router.get('/version', this._httpTools.handle(this._getVersion.bind(this)));
    router.get(
      '/backup',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._getBackup.bind(this)),
    );
    router.post(
      '/import',
      this._httpTools.assertLoggedIn,
      this._httpTools.handle(this._postImport.bind(this)),
    );

    return router;
  }

  private _getVersion(): SchemaVersion {
    return {
      version: getConfig().version,
    };
  }

  private _getBackup(): FileStream {
    throw new NotImplemented();
  }

  private _postImport(): void {
    throw new NotImplemented();
  }
}
