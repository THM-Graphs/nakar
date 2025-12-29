import http from 'http';
import type { Application } from 'express';
import express from 'express';
import type { DatabaseService } from '../database/DatabaseService';
import cors from 'cors';
import type { ApplicationService } from '../application/ApplicationService';
import type { CanvasService } from '../room/CanvasService';
import type { Neo4jService } from '../neo4j/Neo4jService';
import type { MediaService } from '../media/MediaService';
import { HTTPTools } from './HTTPTools';
import { AuthenticationRouter } from './routers/AuthenticationRouter';
import { RoomRouter } from './routers/RoomRouter';
import { SystemRouter } from './routers/SystemRouter';
import { DatabaseRouter } from './routers/DatabaseRouter';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { ProjectsRouter } from './routers/ProjectsRouter';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { CanvasRouter } from './routers/CanvasRouter';
import { NotesRouter } from './routers/NotesRouter';
import { Logger } from '@strapi/logger';
import { createChildLogger } from '../logger/createChildLogger';
import { getConfig } from '../config/getConfig';
import { SanitizedConfig } from '../config/SanitizedConfig';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    export interface Request {
      nakar: {
        room: Result<'api::v2-room.v2-room'>;
        note: Result<'api::v2-note.v2-note'>;
        database: Result<'api::v2-database-connection.v2-database-connection'>;
        possibleUser: Result<'plugin::users-permissions.user'> | null;
        user: Result<'plugin::users-permissions.user'>;
        project: Result<'api::v2-project.v2-project'>;
        canvas: Result<'api::v2-canvas.v2-canvas'>;
      };
    }
  }
}

export class HTTPService implements ApplicationService {
  private readonly _logger: Logger = createChildLogger(this);

  private readonly _app: Application;
  private readonly _server: http.Server;

  private readonly _httpTools: HTTPTools;

  private readonly _authenticationRouter: AuthenticationRouter;
  private readonly _roomRouter: RoomRouter;
  private readonly _systemRouter: SystemRouter;
  private readonly _databaseRouter: DatabaseRouter;
  private readonly _projectsRouter: ProjectsRouter;
  private readonly _notesRouter: NotesRouter;
  private readonly _canvasRouter: CanvasRouter;

  public constructor(
    databaseService: DatabaseService,
    neo4jService: Neo4jService,
    media: MediaService,
    schemaFactory: SchemaFactoryService,
    roomService: CanvasService,
  ) {
    this._app = express();
    this._server = http.createServer(this._app);
    this._httpTools = new HTTPTools();
    this._authenticationRouter = new AuthenticationRouter(this._httpTools);
    this._roomRouter = new RoomRouter(
      this._httpTools,
      databaseService,
      schemaFactory,
    );
    this._systemRouter = new SystemRouter(this._httpTools);
    this._databaseRouter = new DatabaseRouter(
      this._httpTools,
      databaseService,
      neo4jService,
    );
    this._projectsRouter = new ProjectsRouter(
      this._httpTools,
      schemaFactory,
      databaseService,
    );
    this._canvasRouter = new CanvasRouter(
      this._httpTools,
      databaseService,
      schemaFactory,
      roomService,
    );
    this._notesRouter = new NotesRouter(this._httpTools, databaseService);

    this._setupRoutes();
  }

  public async bootstrap(): Promise<void> {
    this._server.on('close', (): void => {
      this._logger.debug('Server will close.');
    });
    this._server.on('error', (error: Error): void => {
      this._logger.error(`Server error: ${error.message}`);
    });
    this._server.on('listening', (): void => {
      this._logger.info(
        `Server started: ${JSON.stringify(this._server.address())}`,
      );
    });
    this._server.on('upgrade', (message: http.IncomingMessage): void => {
      this._logger.debug(`Server upgrade: ${message.url ?? '-'}`);
    });

    await new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void): void => {
        this._server.once('error', (error: Error): void => {
          reject(error);
        });
        this._server.once('listening', (): void => {
          resolve();
        });
        const config: SanitizedConfig = getConfig();
        this._server.listen(config.port + 1, config.host);
      },
    );
  }

  public async destroy(): Promise<void> {
    this._logger.info('Closing http server...');
    await new Promise<void>(
      (resolve: () => void, reject: (error: Error) => void): void => {
        this._logger.info(`Will close all http connections...`);
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
    this._logger.info('HTTP Server did close.');
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
    this._app.use(this._httpTools.handleMiddleware(this._httpTools.findUser));
    this._app.use('/auth', this._authenticationRouter.register());
    this._app.use('/project', this._projectsRouter.register());
    this._app.use('/note', this._notesRouter.register());
    this._app.use('/room', this._roomRouter.register());
    this._app.use('/canvas', this._canvasRouter.register());
    this._app.use('/system', this._systemRouter.register());
    this._app.use('/database', this._databaseRouter.register());
  }
}
