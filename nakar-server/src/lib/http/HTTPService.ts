import http from 'http';
import type { Application } from 'express';
import express from 'express';
import type { ConfigService } from '../config/ConfigService';
import type { LoggerService } from '../logger/LoggerService';
import type { DatabaseService } from '../database/DatabaseService';
import cors from 'cors';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { ApplicationService } from '../application/ApplicationService';
import type { RoomService } from '../room/RoomService';
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
import { SchemaFactoryService } from '../schema/SchemaFactoryService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      nakar: {
        room: GetRoomDBDTO;
        note: GetNoteDBDTO;
        roomTemplate: GetTemplateDBDTO;
        database: GetDatabaseDBDTO;
      };
    }
  }
}

export class HTTPService implements ApplicationService {
  private readonly _app: Application;
  private readonly _server: http.Server;

  private readonly _httpTools: HTTPTools;

  private readonly _authenticationRouter: AuthenticationRouter;
  private readonly _roomRouter: RoomRouter;
  private readonly _roomTemplateRouter: RoomTemplateRouter;
  private readonly _systemRouter: SystemRouter;
  private readonly _databaseRouter: DatabaseRouter;

  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    databaseService: DatabaseService,
    profiler: ProfilerService,
    neo4jService: Neo4jService,
    media: MediaService,
    schemaFactory: SchemaFactoryService,
    roomService: RoomService,
  ) {
    this._app = express();
    this._server = http.createServer(this._app);
    this._httpTools = new HTTPTools(
      profiler,
      _logger,
      databaseService,
      _config,
    );
    this._authenticationRouter = new AuthenticationRouter(
      this._httpTools,
      _config,
    );
    this._roomRouter = new RoomRouter(
      this._httpTools,
      databaseService,
      schemaFactory,
      _logger,
      roomService,
    );
    this._roomTemplateRouter = new RoomTemplateRouter(
      this._httpTools,
      databaseService,
      schemaFactory,
    );
    this._systemRouter = new SystemRouter(this._httpTools, _config);
    this._databaseRouter = new DatabaseRouter(
      this._httpTools,
      databaseService,
      neo4jService,
      _logger,
      profiler,
      _config,
      media,
      schemaFactory,
    );

    this._setupRoutes();
  }

  public async bootstrap(): Promise<void> {
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
    this._logger.log(this, 'Closing http server...');
    await new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void): void => {
        this._logger.log(this, `Will close all http connections...`);
        this._server.closeAllConnections();
        this._server.close((error?: Error): void => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      },
    );
    this._logger.log(this, 'HTTP Server did close.');
  }

  public getServerInstance(): http.Server {
    return this._server;
  }

  private _setupRoutes(): void {
    this._app.use(
      express.json({
        limit: 1_000_000_000,
      }),
    );
    this._app.use(cors());
    this._app.use('/auth', this._authenticationRouter.register());
    this._app.use('/room', this._roomRouter.register());
    this._app.use('/room-template', this._roomTemplateRouter.register());
    this._app.use('/system', this._systemRouter.register());
    this._app.use('/database', this._databaseRouter.register());
  }
}
