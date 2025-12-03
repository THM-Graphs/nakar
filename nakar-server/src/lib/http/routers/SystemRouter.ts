import { HTTPTools } from '../HTTPTools';
import { ConfigService } from '../../config/ConfigService';
import { Router } from 'express';
import type { SchemaVersion } from '../../../../src-gen/schema';
import { FileStream } from '../../fs/FileStream';
import { NotImplemented } from 'http-errors';
import { BackupService } from '../../backup/BackupService';

export class SystemRouter {
  public constructor(
    private readonly _httpTools: HTTPTools,
    private readonly _config: ConfigService,
    private readonly _backup: BackupService,
  ) {}

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
      version: this._config.version,
    };
  }

  private async _getBackup(): Promise<FileStream> {
    const stream: FileStream = await this._backup.createBackupFile();
    return stream;
  }

  private _postImport(): void {
    throw new NotImplemented();
  }
}
