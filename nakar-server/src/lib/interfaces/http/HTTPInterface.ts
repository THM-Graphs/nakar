import http from 'http';
import express from 'express';
import { Express, Request, Response } from 'express';
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

export class HTTPInterface {
  private readonly _app: Express;
  private readonly _port: number;
  private readonly _server: http.Server;
  private readonly _delegate: HTTPDelegate;

  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    private readonly _database: DatabaseService,
    private readonly _profiler: ProfilerService,
  ) {
    this._app = express();
    this._port = _config.port + 1;
    this._server = http.createServer(this._app);
    this._delegate = new HTTPDelegate(
      this._config,
      this._logger,
      this._database,
    );

    this._setupMiddleware();
    this._setupRoutes();
  }

  public async bootstrap(): Promise<void> {
    await new Promise<void>((resolve: () => void): void => {
      this._server.listen(this._port, (): void => {
        resolve();
      });
    });
    this._logger.log(
      this,
      `Custom server started: ${JSON.stringify(this._server.address())}`,
    );
  }

  public async destroy(): Promise<void> {
    this._logger.debug(this, `Will shutdown custom server.`);
    await new Promise<void>(
      (resolve: () => void, reject: (error: unknown) => void): void => {
        this._server.close((error: Error | undefined): void => {
          if (error == null) {
            resolve();
          } else {
            reject(error);
          }
        });
      },
    );
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
  }

  private _handle<T>(
    handler: (req: Request) => Promise<T> | T,
  ): (req: Request, res: Response) => void {
    return (req: Request, res: Response): void => {
      const task: ProfilerTask = this._profiler.profile(this, req.originalUrl);
      Promise.resolve(handler(req))
        .then((result: T): void => {
          res.status(200);
          res.json(result);
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
