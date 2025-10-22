import http from 'http';
import type {
  Application,
  NextFunction,
  Request,
  RequestHandler,
  Response,
} from 'express';
import express from 'express';
import type { ConfigService } from '../config/ConfigService';
import type { LoggerService } from '../logger/LoggerService';
import type {
  operations,
  SchemaDatabase,
  SchemaDatabaseStats,
  SchemaGetScenariosResult,
  SchemaGraph,
  SchemaGraphElements,
  SchemaGraphMetaData,
  SchemaGraphTable,
  SchemaRoom,
  SchemaRooms,
  SchemaRoomTemplate,
  SchemaRoomTemplates,
  SchemaScenario,
  SchemaScenarioArgument,
  SchemaScenarioGroup,
  SchemaVersion,
} from '../../../src-gen/schema';
import type { DatabaseService } from '../database/DatabaseService';
import { match, P } from 'ts-pattern';
import {
  HttpError,
  InternalServerError,
  NotFound,
  NotImplemented,
  Unauthorized,
} from 'http-errors';
import cors from 'cors';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { ProfilerTask } from '../profiler/ProfilerTask';
import type { ApplicationService } from '../application/ApplicationService';
import type { BackupService } from '../backup/BackupService';
import { FileStream } from '../fs/FileStream';
import fsAsync from 'node:fs/promises';
import fs from 'node:fs';
import fileupload from 'express-fileupload';
import os from 'node:os';
import path from 'path';
import type { RoomService } from '../room/RoomService';
import type { GetScenarioGroupDBDTO } from '../database/dto/GetScenarioGroupDBDTO';
import type { GetScenarioDBDTO } from '../database/dto/GetScenarioDBDTO';
import { SchemaDTOFactory } from './SchemaDTOFactory';
import type { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import z from 'zod';
import type { MutableGraph } from '../room/graph/MutableGraph';
import { CachingSchemaDTOFactory } from './CachingSchemaDTOFactory';
import { SMap } from '../tools/Map';
import { SSet } from '../tools/Set';
import type { GetParameterizedScenariosDBDTO } from '../database/dto/GetParameterizedScenariosDBDTO';
import type { GetDatabaseDBDTO } from '../database/dto/GetDatabaseDBDTO';
import { Neo4jDatabaseInfo } from '../neo4j/Neo4jDatabaseInfo';
import type { Neo4jService } from '../neo4j/Neo4jService';
import type { ExpandNodePreview } from '../neo4j/expand-node-preview/ExpandNodePreview';
import type { MediaService } from '../media/MediaService';
import type { GetNotesDBDTO } from '../database/dto/GetNotesDBDTO';
import * as undici from 'undici';
import type { FinalGraphDisplayConfiguration } from '../room/scenario-pipeline/display-configuration/FinalGraphDisplayConfiguration';
import type { GetTemplateDBDTO } from '../database/dto/GetTemplateDBDTO';

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
    private readonly _neo4jService: Neo4jService,
    private readonly _media: MediaService,
  ) {
    this._app = express();
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this._server = http.createServer(this._app);
    this._schemaDTOFactory = new SchemaDTOFactory(_config, _media);

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
    const assertLoggedIn: RequestHandler = async (
      req: Request,
      res: Response,
      next: NextFunction,
    ): Promise<void> => {
      const jwt: string | null = this._getJWT(req);
      if (jwt == null) {
        this._handleError(res, new Unauthorized());
        return;
      }
      const result: undici.Response = await undici.fetch(
        `http://localhost:${this._config.port}/api/users/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        },
      );
      if (!result.ok) {
        this._handleError(res, new Unauthorized());
        return;
      }
      next();
    };

    this._app.post(
      '/auth',
      this._handle(
        async (
          res: Request,
        ): Promise<
          operations['postAuth']['responses']['200']['content']['application/json']
        > => {
          type Body =
            operations['postAuth']['requestBody']['content']['application/json'];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          const body: Body = res.body as Body;

          const result: undici.Response = await undici.fetch(
            `http://localhost:${this._config.port}/api/auth/local`,
            {
              method: 'POST',
              body: JSON.stringify({
                identifier: body.username,
                password: body.password,
              }),
              headers: {
                'Content-Type': 'application/json',
              },
            },
          );
          const json: unknown = await result.json();
          // eslint-disable-next-line @typescript-eslint/typedef
          const responseType = z.object({
            jwt: z.string().optional(),
            user: z
              .object({
                documentId: z.string(),
                username: z.string(),
              })
              .optional(),
            error: z
              .object({
                status: z.number(),
                name: z.string(),
                message: z.string(),
              })
              .optional(),
          });
          const response: z.infer<typeof responseType> =
            responseType.parse(json);

          if (response.jwt == null || response.user == null) {
            throw new Unauthorized();
          }

          return {
            username: response.user.username,
            jwt: response.jwt,
          };
        },
      ),
    );
    this._app.get(
      '/auth',
      assertLoggedIn,
      this._handle(
        async (
          req: Request,
        ): Promise<
          operations['getAuth']['responses']['200']['content']['application/json']
        > => {
          const jwt: string | null = this._getJWT(req);
          if (jwt == null) {
            throw new Unauthorized();
          }

          const result: undici.Response = await undici.fetch(
            `http://localhost:${this._config.port}/api/users/me`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${jwt}`,
              },
            },
          );
          const json: unknown = await result.json();
          // eslint-disable-next-line @typescript-eslint/typedef
          const responseType = z.object({
            documentId: z.string().optional(),
            username: z.string().optional(),
            error: z
              .object({
                status: z.number(),
                name: z.string(),
                message: z.string(),
              })
              .optional(),
          });
          const response: z.infer<typeof responseType> =
            responseType.parse(json);

          if (response.username == null) {
            throw new Unauthorized();
          }

          return {
            username: response.username,
          };
        },
      ),
    );
    this._app.get(
      '/room/:id/scenarios',
      this._handle(async (req: Request): Promise<SchemaGetScenariosResult> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const scenarioGroups: GetScenarioGroupDBDTO[] =
          await this._databaseService.getScenarioGroups(room.documentId);
        const scenarioGroupSchemas: SchemaScenarioGroup[] = await Promise.all(
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
                  return this._schemaDTOFactory.createSchemaScenario(scenario);
                },
              );
              return this._schemaDTOFactory.createSchemaScenarioGroup(
                scenarioGroup,
                scenarioSchemas,
              );
            },
          ),
        );

        const parameterizedSceanrios: GetParameterizedScenariosDBDTO =
          await this._databaseService.getParameterizedScenarios(
            room.documentId,
          );

        const referencedDatabases: SMap<string, GetDatabaseDBDTO> = new SMap<
          string,
          GetDatabaseDBDTO
        >();
        for (const scenarioGroup of scenarioGroups) {
          const scenarios: GetScenarioDBDTO[] =
            await this._databaseService.getScenarios(scenarioGroup.documentId);
          for (const scenario of scenarios) {
            for (const query of scenario.queries) {
              if (query.database != null) {
                referencedDatabases.set(
                  query.database.documentId,
                  query.database,
                );
              }
            }
          }
        }

        return {
          scenarioGroups: scenarioGroupSchemas,
          parameterizedScenarios: parameterizedSceanrios.groups.map(
            (
              g: GetScenarioGroupDBDTO & {
                parameterizedScenarios: GetScenarioDBDTO[];
              },
            ): SchemaScenarioGroup =>
              this._schemaDTOFactory.createSchemaScenarioGroup(
                g,
                g.parameterizedScenarios.map(
                  (s: GetScenarioDBDTO): SchemaScenario =>
                    this._schemaDTOFactory.createSchemaScenario(s),
                ),
              ),
          ),
          referencedDatabases: referencedDatabases
            .toValueArray()
            .map(
              (referencedDatabase: GetDatabaseDBDTO): SchemaDatabase =>
                this._schemaDTOFactory.createSchemaDatabase(referencedDatabase),
            ),
        };
      }),
    );

    this._app.get(
      '/room',
      assertLoggedIn,
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

    this._app.post(
      '/room',
      this._handle(async (req: Request): Promise<SchemaRoom> => {
        type Body =
          operations['createRoom']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const body: Body = req.body as Body;
        const template: GetTemplateDBDTO | null =
          await this._databaseService.getRoomTemplate(body.templateId);
        if (template == null) {
          throw new NotFound(`Template ${body.templateId} not found.`);
        }

        const room: GetRoomDBDTO =
          await this._databaseService.createRoom(template);
        const result: SchemaRoom = this._schemaDTOFactory.createSchemaRoom(
          room,
          await this._getScenarioOfRoom(room),
        );
        return result;
      }),
    );

    this._app.get(
      '/room-template',
      this._handle(async (): Promise<SchemaRoomTemplates> => {
        const dbResult: GetTemplateDBDTO[] =
          await this._databaseService.getRoomTemplates();
        return {
          roomTemplates: dbResult.map(
            (roomTemplate: GetTemplateDBDTO): SchemaRoomTemplate => {
              return this._schemaDTOFactory.createSchemaRoomTemplate(
                roomTemplate,
              );
            },
          ),
        };
      }),
    );

    this._app.get(
      '/room-template/:id',
      this._handle(async (req: Request): Promise<SchemaRoomTemplate> => {
        const id: string = this._getPathParameter(req, 'id');
        const dbResult: GetTemplateDBDTO | null =
          await this._databaseService.getRoomTemplate(id);
        if (dbResult == null) {
          throw new NotFound(`Template ${id} not found.`);
        }
        return this._schemaDTOFactory.createSchemaRoomTemplate(dbResult);
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
          new CachingSchemaDTOFactory(
            this._databaseService,
            this._logger,
            this._config,
            this._media,
            this._profiler,
          );
        const notes: GetNotesDBDTO = await this._databaseService.getNotes({
          room: room,
          graph: graph,
        });
        const config: FinalGraphDisplayConfiguration =
          await this._databaseService.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
            room.documentId,
          );
        const result: SchemaGraph = await cachedGraphFactory.createSchemaGraph(
          graph,
          notes,
          config,
        );
        return result;
      }),
    );

    this._app.get(
      '/room/:id/graph/elements',
      this._handle(async (req: Request): Promise<SchemaGraphElements> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const cachedGraphFactory: CachingSchemaDTOFactory =
          new CachingSchemaDTOFactory(
            this._databaseService,
            this._logger,
            this._config,
            this._media,
            this._profiler,
          );
        const notes: GetNotesDBDTO = await this._databaseService.getNotes({
          room: room,
          graph: graph,
        });
        const config: FinalGraphDisplayConfiguration =
          await this._databaseService.getGraphDisplayConfiguration(
            graph.metaData.scenarioId,
            room.documentId,
          );
        const result: SchemaGraphElements =
          await cachedGraphFactory.createSchemaGraphElements(
            graph,
            notes,
            config,
          );
        return result;
      }),
    );

    this._app.get(
      '/room/:id/graph/meta-data',
      this._handle(async (req: Request): Promise<SchemaGraphMetaData> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const cachedGraphFactory: CachingSchemaDTOFactory =
          new CachingSchemaDTOFactory(
            this._databaseService,
            this._logger,
            this._config,
            this._media,
            this._profiler,
          );
        const result: SchemaGraphMetaData =
          await cachedGraphFactory.createSchemaGraphMetaData(graph);
        return result;
      }),
    );

    this._app.get(
      '/room/:id/graph/table',
      this._handle(async (req: Request): Promise<SchemaGraphTable> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const cachedGraphFactory: CachingSchemaDTOFactory =
          new CachingSchemaDTOFactory(
            this._databaseService,
            this._logger,
            this._config,
            this._media,
            this._profiler,
          );
        const result: SchemaGraphTable = cachedGraphFactory.createSchemaTable(
          graph.tableData,
        );
        return result;
      }),
    );

    this._app.post(
      '/room/:id/notes',
      assertLoggedIn,
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postNote']['requestBody']['content']['application/json'];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        this._logger.debug(this, JSON.stringify(requestBody));
        await this._databaseService.addNote({
          content: requestBody.content,
          room: room,
          nodeIds: requestBody.nodeIds,
          author: null,
          color: requestBody.color?.color ?? null,
        });
      }),
    );

    this._app.delete(
      '/room/:id/note/:noteId',
      assertLoggedIn,
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const noteId: string = this._getPathParameter(req, 'noteId');

        this._logger.debug(
          this,
          `Will delete note ${noteId} in room ${room.documentId}`,
        );
        await this._databaseService.removeNote({ id: noteId });
      }),
    );

    this._app.put(
      '/room/:id/note/:noteId',
      assertLoggedIn,
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const noteId: string = this._getPathParameter(req, 'noteId');
        type Body =
          operations['putNote']['requestBody']['content']['application/json'];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        this._logger.debug(
          this,
          `Will update note ${noteId} in room ${room.documentId} with ${JSON.stringify(requestBody)}`,
        );
        await this._databaseService.updateNote(noteId, {
          nodeIds: requestBody.nodeIds,
          content: requestBody.content,
          color: requestBody.color?.color ?? null,
        });
      }),
    );

    this._app.get(
      '/system/version',
      this._handle((): SchemaVersion => {
        return {
          version: this._config.version,
        };
      }),
    );

    this._app.get(
      '/system/backup',
      assertLoggedIn,
      this._handle(async (): Promise<FileStream> => {
        const stream: FileStream = await this._backup.createBackupFile();
        return stream;
      }),
    );

    this._app.post(
      '/system/import',
      assertLoggedIn,
      this._handle((): void => {
        throw new NotImplemented();
      }),
    );

    this._app.post(
      '/room/:id/actions/load-scenario',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionLoadScenario']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const body: Body = req.body as Body;
        const scenarioId: string = body.scenarioId;
        const args: readonly SchemaScenarioArgument[] = body.arguments;

        const scenarioArgs: SMap<string, unknown> = args.reduce<
          SMap<string, unknown>
        >(
          (
            akku: SMap<string, unknown>,
            next: SchemaScenarioArgument,
          ): SMap<string, unknown> => {
            const parsed: unknown = JSON.parse(next.value);
            return akku.bySetting(next.identifier, parsed);
          },
          new SMap<string, unknown>(),
        );

        await this._roomService.loadScenario({
          roomId: room.documentId,
          scenarioId: scenarioId,
          arguments: scenarioArgs,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/reload-scenario',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);
        const graph: MutableGraph = this._roomService.getGraph(room.documentId);
        const scenarioId: string | null = graph.metaData.scenarioId;
        if (scenarioId == null) {
          throw new NotFound(`Scenario of room ${room.documentId} not found.`);
        }

        await this._roomService.reloadScenario({
          roomId: room.documentId,
          scenarioId: scenarioId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/expand-node',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionExpandNode']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        await this._roomService.expandNode({
          roomId: room.documentId,
          nodeId: requestBody.nodeId,
          limit:
            requestBody.limit != null
              ? {
                  relationships: new SSet(requestBody.limit.relationships),
                  labels: new SSet(requestBody.limit.labels),
                }
              : null,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/expand-node-preview',
      this._handle(
        async (
          req: Request,
        ): Promise<
          operations['postRoomActionExpandNodePreview']['responses']['200']['content']['application/json']
        > => {
          const room: GetRoomDBDTO = await this._assertRoom(req);

          type Body =
            operations['postRoomActionExpandNodePreview']['requestBody']['content']['application/json'];
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          const requestBody: Body = req.body as Body;

          const result: ExpandNodePreview | null =
            await this._roomService.expandNodePreview({
              roomId: room.documentId,
              nodeId: requestBody.nodeId,
            });
          return result;
        },
      ),
    );

    this._app.post(
      '/room/:id/actions/delete-elements',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionDeleteElements']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        await this._roomService.deleteElements({
          roomId: room.documentId,
          nodeIds: requestBody.nodes,
          labels: requestBody.labels,
          edgeIds: requestBody.edges,
          edgeTypes: requestBody.edgeTypes,
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

    this._app.post(
      '/room/:id/actions/focus-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionFocusNodes']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        await this._roomService.focusNodes({
          roomId: room.documentId,
          nodeIds: requestBody.nodes,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/undo',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        await this._roomService.undo({
          roomId: room.documentId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/redo',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        await this._roomService.redo({
          roomId: room.documentId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/run-query',
      assertLoggedIn,
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionRunQuery']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        await this._roomService.runQuery({
          roomId: room.documentId,
          query: requestBody.query,
          databaseId: requestBody.databaseId,
          replace: requestBody.replace,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/connect-result-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        await this._roomService.connectResultNodes({
          roomId: room.documentId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/unlock-all-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        this._roomService.unlockAllNodes({
          roomId: room.documentId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/remove-dangling-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        await this._roomService.removeDanglingNodes({
          roomId: room.documentId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/compress-relationships',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        await this._roomService.compressRelationships({
          roomId: room.documentId,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/compress-nodes',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionCompressNodes']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        await this._roomService.compressNodes({
          roomId: room.documentId,
          label: requestBody.label,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/layout-label',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionLayoutLabel']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        await this._roomService.layoutLabel({
          roomId: room.documentId,
          label: requestBody.label,
          layoutSpecification: requestBody.layoutSpecification,
        });
      }),
    );

    this._app.post(
      '/room/:id/actions/show-shortest-path',
      this._handle(async (req: Request): Promise<void> => {
        const room: GetRoomDBDTO = await this._assertRoom(req);

        type Body =
          operations['postRoomActionShowShortestPath']['requestBody']['content']['application/json'];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        const requestBody: Body = req.body as Body;

        await this._roomService.showShortestPath({
          nodeIds: [...requestBody.nodeIds],
          roomId: room.documentId,
        });
      }),
    );

    this._app.get(
      '/database/:id/stats',
      assertLoggedIn,
      this._handle(async (req: Request): Promise<SchemaDatabaseStats> => {
        const databaseId: string = this._getPathParameter(req, 'id');
        const database: GetDatabaseDBDTO | null =
          await this._databaseService.getDatabase(databaseId);
        if (database == null) {
          throw new NotFound(`Database ${databaseId} not found.`);
        }
        const credentials: Neo4jDatabaseInfo =
          Neo4jDatabaseInfo.parse(database);
        const stats: SchemaDatabaseStats = await this._neo4jService.getStats({
          credentials: credentials,
        });

        return stats;
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
            if (result == null) {
              res.end();
            } else {
              res.json(result);
            }
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

  private _getJWT(req: Request): string | null {
    const authHeader: string | null = req.headers.authorization ?? null;
    if (authHeader == null) {
      return null;
    }
    if (authHeader.startsWith('Bearer ')) {
      const jwt: string = authHeader.substring(7, authHeader.length);
      return jwt;
    } else {
      return null;
    }
  }

  private async _getScenarioOfRoom(
    room: GetRoomDBDTO,
  ): Promise<GetScenarioDBDTO | null> {
    const graph: MutableGraph | null = this._roomService.getGraph(
      room.documentId,
    );
    const scenarioId: string | null = graph.metaData.scenarioId;
    if (scenarioId == null) {
      return null;
    }
    const scenario: GetScenarioDBDTO | null =
      await this._databaseService.getScenario(scenarioId);
    return scenario;
  }
}
