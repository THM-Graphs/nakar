import http from 'http';
import express from 'express';
import { Request, Response, Application } from 'express';
import { ConfigService } from '../../services/config/ConfigService';
import { LoggerService } from '../../services/logger/LoggerService';
import {
  SchemaDatabases,
  SchemaRoom,
  SchemaRooms,
  SchemaScenarioGroups,
  SchemaScenarios,
  SchemaVersion,
} from '../../../../src-gen/schema';
import { DatabaseService } from '../../services/database/DatabaseService';
import { match, P } from 'ts-pattern';
import { HttpError, InternalServerError } from 'http-errors';
import cors from 'cors';
import { HTTPDelegate } from './HTTPDelegate';
import { ProfilerService } from '../../services/profiler/ProfilerService';
import { ProfilerTask } from '../../services/profiler/ProfilerTask';
import { ApplicationService } from '../../application/ApplicationService';
import { BackupService } from '../../services/backup/BackupService';
import { FileStream } from '../../tools/fs/FileStream';
import fs from 'node:fs';

export class HTTPInterface implements ApplicationService {
  private readonly _app: Application;
  private readonly _port: number;
  private readonly _server: http.Server;
  private readonly _delegate: HTTPDelegate;

  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
    private readonly _profiler: ProfilerService,
    private readonly _backup: BackupService,
  ) {
    this._app = express();
    this._port = _config.port + 1;
    this._server = http.createServer(this._app as http.RequestListener);
    this._delegate = new HTTPDelegate(
      this._config,
      this._logger,
      this._database,
      this._backup,
    );

    this._setupMiddleware();
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
        this._server.listen(this._port);
      },
    );
  }

  public async destroy(): Promise<void> {
    /* */
  }

  public getServerInstance(): http.Server {
    return this._server;
  }

  private _setupMiddleware(): void {
    this._app.use(express.json());
    this._app.use(cors());
  }

  private _setupRoutes(): void {
    this._app.get(
      '/scenario',
      this._handle(
        (req: Request): Promise<SchemaScenarios> =>
          this._delegate.getScenario(req),
      ),
    );

    this._app.get(
      '/scenario-group',
      this._handle(
        (req: Request): Promise<SchemaScenarioGroups> =>
          this._delegate.getScenarioGroup(req),
      ),
    );

    this._app.get(
      '/database',
      this._handle(
        (): Promise<SchemaDatabases> => this._delegate.getDatabase(),
      ),
    );

    this._app.get(
      '/room',
      this._handle((): Promise<SchemaRooms> => this._delegate.getRoom()),
    );

    this._app.get(
      '/room/:id',
      this._handle(
        (req: Request): Promise<SchemaRoom> => this._delegate.getRoomById(req),
      ),
    );

    this._app.get(
      '/system/version',
      this._handle((): SchemaVersion => this._delegate.getVersion()),
    );

    this._app.get(
      '/system/backup',
      this._handle((): Promise<FileStream> => this._delegate.getBackup()),
    );
  }

  private _handle<T>(
    handler: (req: Request) => Promise<T> | T,
  ): (req: Request, res: Response) => void {
    return (req: Request, res: Response): void => {
      const task: ProfilerTask = this._profiler.profile(this, req.originalUrl);
      Promise.resolve(handler(req))
        .then((result: T): void => {
          res.status(200);
          if (result instanceof FileStream) {
            res.setHeader('content-type', result.contentType);
            res.setHeader(
              'content-disposition',
              `attachment; filename="${result.fileName}"`,
            );
            fs.createReadStream(result.filePath).pipe(res);
          } else {
            res.json(result);
          }
          task.finish();
        })
        .catch((unknownError: unknown): void => {
          task.finish();
          this._logger.error(this, unknownError);
          match(unknownError)
            .with(P.instanceOf(HttpError), (error: HttpError): void => {
              this._handleError(res, error);
            })
            .with(P.instanceOf(Error), (error: Error): void => {
              this._handleError(res, new InternalServerError(error.message));
            })
            .otherwise((error: unknown): void => {
              this._handleError(
                res,
                new InternalServerError(
                  `Unknown error: ${JSON.stringify(error)}`,
                ),
              );
            });
        });
    };
  }

  private _handleError(res: Response, error: HttpError): void {
    res.status(error.status);
    res.json({
      status: error.status,
      message: error.message,
      name: error.name,
    });
  }
}
