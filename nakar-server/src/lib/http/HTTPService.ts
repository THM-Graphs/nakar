import http from 'http';
import type { Application } from 'express';
import express from 'express';
import type { ConfigService } from '../config/ConfigService';
import type { LoggerService } from '../logger/LoggerService';
import type { DatabaseService } from '../database/DatabaseService';
import cors from 'cors';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { ApplicationService } from '../application/ApplicationService';
import type { BackupService } from '../backup/BackupService';
import fsAsync from 'node:fs/promises';
import fileupload from 'express-fileupload';
import os from 'node:os';
import path from 'path';
import type { RoomService } from '../room/RoomService';
import { SchemaDTOFactory } from './SchemaDTOFactory';
import type { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import type { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import type { Neo4jService } from '../neo4j/Neo4jService';
import type { MediaService } from '../media/MediaService';
import type { GetTemplateDBDTO } from '../database/dto/GetTemplateDBDTO';
import type { GetNoteDBDTO } from '../database/dto/GetNoteDBDTO';
import { HTTPTools } from './HTTPTools';
import { AuthenticationRouter } from './routers/AuthenticationRouter';
import { RoomRouter } from './routers/RoomRouter';
import { RoomTemplateRouter } from './routers/RoomTemplateRouter';
import { SystemRouter } from './routers/SystemRouter';
import { DatabaseRouter } from './routers/DatabaseRouter';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      nakarRoom: GetRoomDBDTO;
      nakarNote: GetNoteDBDTO;
      nakarRoomTemplate: GetTemplateDBDTO;
      nakarDatabase: GetDatabaseDBDTO;
    }
  }
}

export class HTTPService implements ApplicationService {
  private readonly _app: Application;
  private readonly _server: http.Server;

  private readonly _schemaDTOFactory: SchemaDTOFactory;
  private readonly _httpTools: HTTPTools;

  private readonly _authenticationRouter: AuthenticationRouter;
  private readonly _roomRouter: RoomRouter;
  private readonly _roomTemplateRouter: RoomTemplateRouter;
  private readonly _systemRouter: SystemRouter;
  private readonly _databaseRouter: DatabaseRouter;

  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    private readonly _databaseService: DatabaseService,
    private readonly _profiler: ProfilerService,
    private readonly _backup: BackupService,
    private readonly _roomService: RoomService,
    private readonly _neo4jService: Neo4jService,
    private readonly _media: MediaService,
  ) {
    this._app = express();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this._server = http.createServer(this._app);
    this._schemaDTOFactory = new SchemaDTOFactory(_config, _media);
    this._httpTools = new HTTPTools(
      _profiler,
      _logger,
      _databaseService,
      _roomService,
      _config,
    );
    this._authenticationRouter = new AuthenticationRouter(
      this._httpTools,
      _config,
    );
    this._roomRouter = new RoomRouter(
      this._httpTools,
      _databaseService,
      this._schemaDTOFactory,
      _roomService,
      _logger,
      _config,
      _media,
      _profiler,
    );
    this._roomTemplateRouter = new RoomTemplateRouter(
      this._httpTools,
      _databaseService,
      this._schemaDTOFactory,
    );
    this._systemRouter = new SystemRouter(this._httpTools, _config, _backup);
    this._databaseRouter = new DatabaseRouter(
      this._httpTools,
      _databaseService,
      _neo4jService,
      _logger,
      _profiler,
      _config,
      _media,
    );

    this._setupMiddleware();
    this._setupRoutes();
  }

  private get _uploadTemporaryDirectoryPath(): string {
    return path.join(os.tmpdir(), 'nakar-fileupload');
  }

  public async bootstrap(): Promise<void> {
    await this._tmpCleanup();

    this._server.on('close', (): void => {
      this._logger.debug(this, 'Server will close.');
    });
    this._server.on('error', (error: Error): void => {
      this._logger.error(this, `Server error: ${error.message}`);
    });
    this._server.on('listening', (): void => {
      this._logger.log(
        this,
        `Server started: ${JSON.stringify(this._server.address())}`,
      );
    });
    this._server.on('upgrade', (message: http.IncomingMessage): void => {
      this._logger.debug(this, `Server upgrade: ${message.url ?? '-'}`);
    });

    await new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void): void => {
        this._server.once('error', (error: Error): void => {
          reject(error);
        });
        this._server.once('listening', (): void => {
          resolve();
        });
        this._server.listen(this._config.port + 1, this._config.host);
      },
    );
  }

  public async destroy(): Promise<void> {
    await this._tmpCleanup();
  }

  public getServerInstance(): http.Server {
    return this._server;
  }

  private async _tmpCleanup(): Promise<void> {
    try {
      this._logger.debug(
        this,
        `Will remove fileupload path ${this._uploadTemporaryDirectoryPath}`,
      );
      await fsAsync.rm(this._uploadTemporaryDirectoryPath, { recursive: true });
    } catch {
      /* ok */
    }
  }

  private _setupMiddleware(): void {
    this._app.use(
      fileupload({
        limits: { fileSize: 2 * Math.pow(1024, 3) }, // 2 GB
        useTempFiles: true,
        tempFileDir: path.join(os.tmpdir(), 'nakar', 'fileupload'),
      }),
    );
    this._app.use(
      express.json({
        limit: 1_000_000_000,
      }),
    );
    this._app.use(cors());
  }

  private _setupRoutes(): void {
    this._app.use('/auth', this._authenticationRouter.register());
    this._app.use('/room', this._roomRouter.register());
    this._app.use('/room-template', this._roomTemplateRouter.register());
    this._app.use('/system', this._systemRouter.register());
    this._app.use('/database', this._databaseRouter.register());
  }
}
