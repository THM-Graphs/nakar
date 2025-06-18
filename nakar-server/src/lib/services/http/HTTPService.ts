import http from 'http';
import express, { Application, Request, Response } from 'express';
import { ConfigService } from '../config/ConfigService';
import { LoggerService } from '../logger/LoggerService';
import {
  SchemaDatabase,
  SchemaDatabases,
  SchemaGraph,
  SchemaGraphElements,
  SchemaGraphMetaData,
  SchemaGraphTable,
  SchemaRoom,
  SchemaRooms,
  SchemaScenario,
  SchemaScenarioGroup,
  SchemaVersion,
} from '../../../../src-gen/schema';
import { DatabaseService } from '../database/DatabaseService';
import { match, P } from 'ts-pattern';
import {
  BadRequest,
  HttpError,
  InternalServerError,
  NotFound,
} from 'http-errors';
import cors from 'cors';
import { ProfilerService } from '../profiler/ProfilerService';
import { ProfilerTask } from '../profiler/ProfilerTask';
import { ApplicationService } from '../../application/ApplicationService';
import { BackupService } from '../backup/BackupService';
import { FileStream } from '../../tools/fs/FileStream';
import fsAsync from 'node:fs/promises';
import fs from 'node:fs';
import fileupload, { FileArray, UploadedFile } from 'express-fileupload';
import os from 'node:os';
import path from 'path';
import { RoomService } from '../room/RoomService';
import { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { SchemaDTOFactory } from './SchemaDTOFactory';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import z from 'zod';
import { InsertResult } from '../backup/InsertResult';
import { MutableGraph } from '../room/graph/MutableGraph';
import { CachingSchemaDTOFactory } from './CachingSchemaDTOFactory';

export class HTTPService implements ApplicationService {
  private readonly _app: Application;
  private readonly _server: http.Server;

  private readonly _schemaDTOFactory: SchemaDTOFactory;

  public constructor(
    private readonly _config: ConfigService,
    private readonly _logger: LoggerService,
    private readonly _databaseService: DatabaseService,
    private readonly _profiler: ProfilerService,
    private readonly _backup: BackupService,
    private readonly _roomService: RoomService,
  ) {
    this._app = express();
    this._server = http.createServer(this._app as http.RequestListener);
    this._schemaDTOFactory = new SchemaDTOFactory(_config);

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
    this._app.use(express.json());
    this._app.use(cors());
  }

  private _setupRoutes(): void {
    this._app.get(
      '/scenarios',
      this._handle(async (): Promise<SchemaDatabases> => {
        const databases: GetDatabaseDBDTO[] =
          await this._databaseService.getDatabases();
        const databaseSchema: SchemaDatabase[] = await Promise.all(
          databases.map(
            async (database: GetDatabaseDBDTO): Promise<SchemaDatabase> => {
              const scenarioGroups: GetScenarioGroupDBDTO[] =
                await this._databaseService.getScenarioGroups(
                  database.documentId,
                );
              const scenarioGroupSchemas: SchemaScenarioGroup[] =
                await Promise.all(
                  scenarioGroups.map(
                    async (
                      scenarioGroup: GetScenarioGroupDBDTO,
                    ): Promise<SchemaScenarioGroup> => {
                      const scenarios: GetScenarioDBDTO[] =
                        await this._databaseService.getScenarios(
                          scenarioGroup.documentId,
                        );
                      const scenarioSchemas: SchemaScenario[] = scenarios.map(
                        (scenario: GetScenarioDBDTO): SchemaScenario => {
                          return this._schemaDTOFactory.createSchemaScenario(
                            scenario,
                          );
                        },
                      );
                      return this._schemaDTOFactory.createSchemaScenarioGroup(
                        scenarioGroup,
                        scenarioSchemas,
                      );
                    },
                  ),
                );
              return this._schemaDTOFactory.createSchemaDatabase(
                database,
                scenarioGroupSchemas,
              );
            },
          ),
        );
        return {
          databases: databaseSchema,
        };
      }),
    );

    this._app.get(
      '/room',
      this._handle(async (): Promise<SchemaRooms> => {
        const dbResult: GetRoomDBDTO[] = await this._databaseService.getRooms();
        return {
          rooms: await Promise.all(
            dbResult.map(async (room: GetRoomDBDTO): Promise<SchemaRoom> => {
              return this._schemaDTOFactory.createSchemaRoom(
                room,
                await this._getScenarioOfRoom(room),
              );
            }),
          ),
        };
      }),
    );

    this._app.get(
      '/room/:id',
      this._handle(async (req: Request): Promise<SchemaRoom> => {
        const dbResult: GetRoomDBDTO = await this._assertRoom(req);
        return this._schemaDTOFactory.createSchemaRoom(
          dbResult,
          await this._getScenarioOfRoom(dbResult),
        );
      }),
    );

    this._app.get(
      '/room/:id/graph',
      this._handle(async (req: Request): Promise<SchemaGraph> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const cachedGraphFactory: CachingSchemaDTOFactory =
          new CachingSchemaDTOFactory(this._databaseService, this._logger);
        const result: SchemaGraph =
          await cachedGraphFactory.createSchemaGraph(graph);
        return result;
      }),
    );

    this._app.get(
      '/room/:id/graph/elements',
      this._handle(async (req: Request): Promise<SchemaGraphElements> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const cachedGraphFactory: CachingSchemaDTOFactory =
          new CachingSchemaDTOFactory(this._databaseService, this._logger);
        const result: SchemaGraphElements =
          await cachedGraphFactory.createSchemaGraphElements(graph);
        return result;
      }),
    );

    this._app.get(
      '/room/:id/graph/meta-data',
      this._handle(async (req: Request): Promise<SchemaGraphMetaData> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const cachedGraphFactory: CachingSchemaDTOFactory =
          new CachingSchemaDTOFactory(this._databaseService, this._logger);
        const result: SchemaGraphMetaData =
          cachedGraphFactory.createSchemaGraphMetaData(graph.metaData);
        return result;
      }),
    );

    this._app.get(
      '/room/:id/graph/table',
      this._handle(async (req: Request): Promise<SchemaGraphTable> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const cachedGraphFactory: CachingSchemaDTOFactory =
          new CachingSchemaDTOFactory(this._databaseService, this._logger);
        const result: SchemaGraphTable = cachedGraphFactory.createSchemaTable(
          graph.tableData,
        );
        return result;
      }),
    );

    this._app.get(
      '/system/version',
      this._handle((): SchemaVersion => {
        const packageVersion: string | undefined =
          process.env['npm_package_version'];
        return {
          version: packageVersion ?? 'unknown',
        };
      }),
    );

    this._app.get(
      '/system/backup',
      this._handle(async (): Promise<FileStream> => {
        const stream: FileStream = await this._backup.createBackupFile();
        return stream;
      }),
    );

    this._app.post(
      '/system/import',
      this._handle(async (req: Request): Promise<unknown> => {
        const files: FileArray | null | undefined = req.files;
        if (files == null) {
          throw new BadRequest('No files on request body.');
        }
        const file: UploadedFile | UploadedFile[] = files['file'];

        if (Array.isArray(file)) {
          throw new BadRequest('Only one file is allowed.');
        }

        const insertResult: InsertResult = await this._backup.importBackupFile(
          file.tempFilePath,
        );

        if (insertResult.errors.length > 0) {
          throw new BadRequest(
            JSON.stringify(
              insertResult.errors
                .map((error: unknown): string => JSON.stringify(error))
                .join('\n'),
            ),
          );
        }

        return {
          insertedDatabases: insertResult.insertedDatabases.toArray(),
          insertedScenarioGroups: insertResult.insertedScenarioGroups.toArray(),
          insertedScenarios: insertResult.insertedScenarios.toArray(),
        };
      }),
    );

    this._app.post(
      '/room/:id/actions/load-scenario',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const scenarioId: string = this._getBodyString(req, 'scenarioId');

        await this._roomService.loadScenario({
          roomId: room.documentId,
          scenarioId: scenarioId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/expand-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const requestBody: { nodes: string[] } = z
          .object({
            nodes: z.array(z.string()),
          })
          .parse(req.body);
        const nodes: string[] = requestBody.nodes;

        await this._roomService.expandNodes({
          roomId: room.documentId,
          nodeIds: nodes,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/delete-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const requestBody: { nodes: string[] } = z
          .object({
            nodes: z.array(z.string()),
          })
          .parse(req.body);
        const nodes: string[] = requestBody.nodes;

        await this._roomService.deleteNodes({
          roomId: room.documentId,
          nodeIds: nodes,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/relayout',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        this._roomService.relayout({ roomId: room.documentId });
      }),
    );

    this._app.post(
      '/room/:id/actions/unlock-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const requestBody: { nodes: string[] } = z
          .object({
            nodes: z.array(z.string()),
          })
          .parse(req.body);
        const nodes: string[] = requestBody.nodes;

        this._roomService.unlockNodes({
          roomId: room.documentId,
          nodeIds: nodes,
        });
      }),
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
    res.send(error.message);
  }

  private async _assertRoom(req: Request): Promise<GetRoomDBDTO> {
    const id: string = this._getPathParameter(req, 'id');
    const dbResult: GetRoomDBDTO | null =
      await this._databaseService.getRoom(id);
    if (dbResult == null) {
      throw new NotFound('Room not found.');
    }
    return dbResult;
  }

  private _getQueryParameter(req: Request, name: string): string {
    const value: string = z.string().parse(req.query[name]);
    return value;
  }

  private _getPathParameter(req: Request, name: string): string {
    const value: string = z.string().parse(req.params[name]);
    return value;
  }

  private _getBodyString(req: Request, name: string): string {
    // eslint-disable-next-line @typescript-eslint/typedef
    const schema = z.object({
      [name]: z.string(),
    });
    const value: string = schema.parse(req.body)[name];
    return value;
  }

  private async _getScenarioOfRoom(
    room: GetRoomDBDTO,
  ): Promise<GetScenarioDBDTO | null> {
    const scenarioId: string | null =
      this._roomService.getGraph(room.documentId).metaData.scenarioInfo?.id ??
      null;
    const scenario: GetScenarioDBDTO | null =
      scenarioId != null
        ? await this._databaseService.getScenario(scenarioId)
        : null;
    return scenario;
  }
}
