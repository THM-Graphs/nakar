import type { DisconnectReason, Socket as UntypedSocket } from 'socket.io';
import { Server as UntypedServer } from 'socket.io';
import type {
  SchemaGraphElements,
  SchemaGraphMetaData,
  SchemaGraphTable,
  SchemaPhysicalNode,
  SchemaWsActionGrabNode,
  SchemaWsActionJoinCanvas,
  SchemaWsActionMoveNodes,
  SchemaWsActionUngrabNode,
  SchemaWsClientToServerMessage,
  SchemaWsEventCanvasChanged,
  SchemaWsEventClearProgress,
  SchemaWsEventKick,
  SchemaWsEventNotification,
  SchemaWsEventProgress,
  SchemaWsEventSetNodeLocks,
  SchemaWsServerToClientMessage,
} from '../../../src-gen/schema';
import { match, P } from 'ts-pattern';
import type { ServerToClientEvents } from './ServerToClientEvents';
import type { ClientToServerEvents } from './ClientToServerEvents';
import { WSClient } from './WSClient';
import { SSet } from '../tools/Set';
import type { CanvasService } from '../room/CanvasService';
import type { DatabaseService } from '../database/DatabaseService';
import type { LoggerService } from '../logger/LoggerService';
import type http from 'http';
import type { ApplicationService } from '../application/ApplicationService';
import type { Subscription } from 'rxjs';
import type { HTTPService } from '../http/HTTPService';
import type { CanvasEvent } from '../room/events/CanvasEvent';
import type { CanvasEventGraphMetaDataChanged } from '../room/events/CanvasEventGraphMetaDataChanged';
import type { CanvasEventRoomPhysicsUpdated } from '../room/events/CanvasEventRoomPhysicsUpdated';
import type { CanvasEventNodeLocksUpdated } from '../room/events/CanvasEventNodeLocksUpdated';
import type { CanvasEventProgressChanged } from '../room/events/CanvasEventProgressChanged';
import type { CanvasEventProgressCleared } from '../room/events/CanvasEventProgressCleared';
import type { CanvasEventGraphElementsChanged } from '../room/events/CanvasEventGraphElementsChanged';
import type { CanvasEventGraphTableChanged } from '../room/events/CanvasEventGraphTableChanged';
import type { CanvasEventEventKick } from '../room/events/CanvasEventEventKick';
import type { CanvasEventNotAllNodesLoaded } from '../room/events/CanvasEventNotAllNodesLoaded';
import type { ProfilerTask } from '../profiler/ProfilerTask';
import type { ProfilerService } from '../profiler/ProfilerService';
import type { MutableGraph } from '../room/graph/MutableGraph';
import { SchemaFactoryService } from '../schema/SchemaFactoryService';
import { CanvasEventError } from '../room/events/CanvasEventError';
import { Result } from '@strapi/types/dist/modules/documents/result';
import { IndexedNoteCollection } from '../database/IndexedNoteCollection';

export type Server = UntypedServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = UntypedSocket<ClientToServerEvents, ServerToClientEvents>;

export class SocketIOService implements ApplicationService {
  private readonly _sockets: SSet<WSClient>;
  private _io: UntypedServer | null;
  private _isShuttingDownFlag: boolean;

  public constructor(
    private readonly _canvasService: CanvasService,
    private readonly _databaseService: DatabaseService,
    private readonly _httpService: HTTPService,
    private readonly _logger: LoggerService,
    private readonly _profiler: ProfilerService,
    private readonly _schemaFactory: SchemaFactoryService,
  ) {
    this._sockets = new SSet();
    this._io = null;
    this._isShuttingDownFlag = false;
  }

  public get sockets(): SSet<WSClient> {
    return this._sockets;
  }

  public bootstrap(): void {
    const httpServer: http.Server = this._httpService.getServerInstance();

    const io: UntypedServer = new UntypedServer(httpServer, {
      cors: {
        origin: '*',
      },
      path: '/socket.io',
      serveClient: false,
    });
    this._io = io;

    this._logger.log(
      this,
      `Did register socket.io server on ${JSON.stringify(httpServer.address())}. Path: ${this._io.path()}`,
    );

    this._registerWebsocketEvents(io);
    this._registerCanvasEvents();
    this._registerDatabaseServiceEvents();
  }

  public destroy(): void {
    this._isShuttingDownFlag = true;
    if (this._io == null) {
      return;
    }

    this._io.emit('message', {
      type: 'WSEventNotification',
      notification: {
        severity: 'error',
        message: 'The Server did shut down.',
        date: new Date().toISOString(),
      },
    } satisfies SchemaWsEventNotification);

    for (const client of this.sockets) {
      this._logger.log(this, `Will disconnect ws client: ${client.id}`);
      client.native.disconnect(true);
    }
  }

  public sendToRoom(
    roomId: string,
    message: SchemaWsServerToClientMessage,
  ): void {
    if (this._io == null) {
      this._logger.warn(this, 'IO is not defined!');
      return;
    }
    this._io.to(roomId).emit('message', message);
  }

  public sendToUser(
    userId: string,
    message: SchemaWsServerToClientMessage,
  ): void {
    const user: WSClient | null = this.sockets.find(
      (s: WSClient): boolean => s.id === userId,
    );
    if (user == null) {
      this._logger.error(
        this,
        `Unable to send ${message.type} to user ${userId}. User does not exist.`,
      );
      return;
    }
    user.send(message);
  }

  public handleRoomError(roomId: string, error: unknown): void {
    this.sendToRoom(roomId, this.createErrorNotification(error));
  }

  public createErrorNotification(error: unknown): SchemaWsEventNotification {
    const errorMessage: string = match(error)
      .with(P.instanceOf(Error), (e: Error): string => e.message)
      .otherwise((e: unknown): string => JSON.stringify(e));
    return {
      type: 'WSEventNotification',
      notification: {
        severity: 'error',
        message: errorMessage,
        date: new Date().toISOString(),
      },
    };
  }

  private _registerWebsocketEvents(io: UntypedServer): void {
    io.on('connection', (s: Socket): void => {
      const wsClient: WSClient = new WSClient(s, io, this._logger);
      this._sockets.add(wsClient);
      this._logger.debug(this, `New socket ${wsClient.id} connection.`);
      this._registerWebsocketClientEvents(wsClient);
    });
  }

  private _registerWebsocketClientEvents(wsClient: WSClient): void {
    const clientSubscriptions: Subscription[] = [
      wsClient.onRoomChanged$.subscribe(
        (roomChange: [string | null, string | null]): void => {
          const oldCanvasId: string | null = roomChange[0];
          const newCanvasId: string | null = roomChange[1];

          if (oldCanvasId != null && newCanvasId == null) {
            this.sendToRoom(oldCanvasId, {
              type: 'WSEventNotification',
              notification: {
                message: `User ${wsClient.id} left.`,
                date: new Date().toISOString(),
                severity: 'message',
              },
            } satisfies SchemaWsEventNotification);

            if (this._userCountOfRoom(oldCanvasId) === 0) {
              if (!this._isShuttingDownFlag) {
                // Do not close rooms if service is shutting down,
                // because we cannot wait for the rooms to close.
                // Room closing will be done by the RoomService.
                this._databaseService
                  .getCanvas(oldCanvasId)
                  .then(
                    async (
                      oldCanvas: Result<'api::v2-canvas.v2-canvas'> | null,
                    ): Promise<void> => {
                      if (oldCanvas == null) {
                        this._logger.warn(
                          this,
                          'Cannot find canvas to shut down.',
                        );
                        await Promise.resolve();
                        return;
                      } else {
                        await this._canvasService.destroyCanvas(oldCanvas);
                        return;
                      }
                    },
                  )
                  .catch((error: unknown): void => {
                    this._logger.error(this, error);
                  });
              }
            }
          } else if (newCanvasId != null && newCanvasId !== oldCanvasId) {
            wsClient.broadcastToRoom({
              type: 'WSEventNotification',
              notification: {
                message: `User ${wsClient.id} joined.`,
                severity: 'message',
                date: new Date().toISOString(),
              },
            });
            this._databaseService
              .getCanvas(newCanvasId)
              .then(
                async (
                  canvas: Result<'api::v2-canvas.v2-canvas'> | null,
                ): Promise<void> => {
                  if (canvas != null) {
                    await this._canvasService.startCanvas(canvas);
                  }
                },
              )
              .catch((error: unknown): void => {
                this._logger.error(this, error);
              });
          }

          wsClient.send({
            type: 'WSEventCanvasChanged',
            canvasId: newCanvasId,
          } satisfies SchemaWsEventCanvasChanged);
        },
      ),
      wsClient.onMessage$.subscribe(
        (clientToServerMessage: SchemaWsClientToServerMessage): void => {
          (async (): Promise<void> => {
            try {
              if (clientToServerMessage.type !== 'WSActionMoveNodes') {
                this._logger.debug(
                  this,
                  `Did receive from client ${wsClient.id}: ${clientToServerMessage.type}`,
                );
              }
              await match(clientToServerMessage)
                .returnType<void | Promise<void>>()
                .with(
                  { type: 'WSActionJoinCanvas' },
                  async (m: SchemaWsActionJoinCanvas): Promise<void> => {
                    const canvas: Result<'api::v2-canvas.v2-canvas'> | null =
                      await this._databaseService.getCanvas(m.canvasId);
                    if (canvas == null) {
                      throw new Error(
                        `Canvas ${m.canvasId} not found. Socket tried to join.`,
                      );
                    }

                    await wsClient.join(canvas.documentId);
                  },
                )
                .with(
                  { type: 'WSActionLeaveCanvas' },
                  async (): Promise<void> => {
                    await wsClient.leaveRoom({ silent: false });
                  },
                )
                .with(
                  { type: 'WSActionGrabNode' },
                  async (m: SchemaWsActionGrabNode): Promise<void> => {
                    this._canvasService
                      .getCanvas(await this._assertRoom(wsClient))
                      .grabNode({
                        nodeId: m.nodeId,
                        userId: wsClient.id,
                      });
                  },
                )
                .with(
                  { type: 'WSActionMoveNodes' },
                  async (m: SchemaWsActionMoveNodes): Promise<void> => {
                    this._canvasService
                      .getCanvas(await this._assertRoom(wsClient))
                      .moveNodes({
                        nodes: m.nodes,
                        userId: wsClient.id,
                      });
                  },
                )
                .with(
                  { type: 'WSActionUngrabNode' },
                  async (m: SchemaWsActionUngrabNode): Promise<void> => {
                    this._canvasService
                      .getCanvas(await this._assertRoom(wsClient))
                      .ungrabNode({
                        node: m.node,
                        userId: wsClient.id,
                      });
                  },
                )
                .exhaustive();
            } catch (error: unknown) {
              this._logger.error(
                this,
                `Error handeling WS message: ${JSON.stringify(clientToServerMessage)}`,
              );
              this._logger.error(this, error);
              wsClient.send(this.createErrorNotification(error));
            }
          })().catch((error: unknown): void => {
            this._logger.error(this, error);
          });
        },
      ),
      wsClient.onDisconnect$.subscribe((reason: DisconnectReason): void => {
        this._logger.debug(
          this,
          `Socket ${wsClient.id} disconnected: ${reason}`,
        );
        this._sockets.delete(wsClient);
        setTimeout((): void => {
          // Workaround to receive leave room event
          for (const sub of clientSubscriptions) {
            sub.unsubscribe();
          }
        }, 10000);
      }),
    ];
  }

  private _registerCanvasEvents(): void {
    this._canvasService.onEvent$.subscribe((event: CanvasEvent): void => {
      if (event.type !== 'CanvasEventRoomPhysicsUpdated') {
        this._logger.debug(
          this,
          `Did receive from room service (room ${event.canvasId}): ${event.type}`,
        );
      }
      Promise.resolve(
        match(event)
          .returnType<void | Promise<void>>()
          .with(
            { type: 'CanvasEventGraphTableChanged' },
            (message: CanvasEventGraphTableChanged): void => {
              const table: SchemaGraphTable =
                this._schemaFactory.createSchemaTable(message.table);
              this.sendToRoom(message.canvasId, {
                table: table,
                type: 'WSEventGraphTableChanged',
              });
            },
          )
          .with(
            { type: 'CanvasEventGraphMetaDataChanged' },
            async (message: CanvasEventGraphMetaDataChanged): Promise<void> => {
              const metaData: SchemaGraphMetaData =
                await this._schemaFactory.createSchemaGraphMetaData(
                  message.graph,
                  message.undoInfo,
                );
              this.sendToRoom(message.canvasId, {
                metaData: metaData,
                type: 'WSEventGraphMetaDataChanged',
              });
            },
          )
          .with(
            { type: 'CanvasEventGraphElementsChanged' },
            (message: CanvasEventGraphElementsChanged): void => {
              (async (): Promise<void> => {
                const canvas: Result<'api::v2-canvas.v2-canvas'> | null =
                  await this._databaseService.getCanvas(message.canvasId);
                if (canvas == null) {
                  this._logger.error(
                    this,
                    'Cannot handle CanvasEventGraphElementsChanged. Canvas not found.',
                  );
                  return;
                }
                const project: Result<'api::v2-project.v2-project'> | null =
                  await this._databaseService.getProjectOfCanvas(canvas);

                if (project == null) {
                  this._logger.error(
                    this,
                    'Cannot handle CanvasEventGraphElementsChanged. Project not found.',
                  );
                  return;
                }

                const notes: IndexedNoteCollection =
                  await this._databaseService.getNotes({
                    project: project,
                    graph: message.graph,
                  });

                const graphElements: SchemaGraphElements =
                  await this._schemaFactory.createSchemaGraphElements(
                    message.graph,
                    notes,
                    canvas,
                  );
                this.sendToRoom(message.canvasId, {
                  elements: graphElements,
                  type: 'WSEventGraphElementsChanged',
                });
              })().catch((error: unknown): void => {
                this._logger.error(this, error);
              });
            },
          )
          .with(
            { type: 'CanvasEventRoomPhysicsUpdated' },
            (message: CanvasEventRoomPhysicsUpdated): void => {
              for (const socket of this.sockets) {
                if (socket.room !== message.canvasId) {
                  continue;
                }

                const task: ProfilerTask = this._profiler.profile(
                  this,
                  `Filter node grabs for client ${socket.id} in room ${socket.room}`,
                  true,
                );
                const nodesToSend: SchemaPhysicalNode[] = [];
                for (const node of message.graph.nodes.nodes) {
                  if (!node.grabs.has(socket.id)) {
                    nodesToSend.push({
                      id: node.id,
                      position: { x: node.position.x, y: node.position.y },
                    });
                  }
                }
                task.finish();

                socket.send({
                  type: 'WSEventNodesMoved',
                  nodes: nodesToSend,
                  date: new Date().toISOString(),
                  performance: message.performance,
                });
              }
            },
          )
          .with(
            { type: 'CanvasEventNodeLocksUpdated' },
            (message: CanvasEventNodeLocksUpdated): void => {
              const locks: { id: string; locked: boolean }[] = [];
              for (const lock of message.locks.entries()) {
                locks.push({
                  id: lock[0],
                  locked: lock[1],
                });
              }
              this.sendToRoom(message.canvasId, {
                type: 'WSEventSetNodeLocks',
                locks: locks,
              } satisfies SchemaWsEventSetNodeLocks);
            },
          )
          .with(
            { type: 'CanvasEventProgressChanged' },
            (message: CanvasEventProgressChanged): void => {
              this.sendToRoom(message.canvasId, {
                type: 'WSEventProgress',
                message: message.message,
                progress: message.progress,
              } satisfies SchemaWsEventProgress);
            },
          )
          .with(
            { type: 'CanvasEventProgressCleared' },
            (message: CanvasEventProgressCleared): void => {
              this.sendToRoom(message.canvasId, {
                type: 'WSEventClearProgress',
              } satisfies SchemaWsEventClearProgress);
            },
          )
          .with(
            { type: 'CanvasEventKick' },
            (message: CanvasEventEventKick): void => {
              this.sendToRoom(message.canvasId, {
                type: 'WSEventKick',
              } satisfies SchemaWsEventKick);
            },
          )
          .with(
            { type: 'CanvasEventNotAllNodesLoaded' },
            (message: CanvasEventNotAllNodesLoaded): void => {
              this.sendToRoom(message.canvasId, {
                type: 'WSEventNotification',
                notification: {
                  message: `Not all graph elements loaded. Did load ${message.loadedCount.toString()} elements.`,
                  date: new Date().toISOString(),
                  severity: 'warning',
                },
              } satisfies SchemaWsEventNotification);
            },
          )
          .with(
            { type: 'CanvasEventError' },
            (message: CanvasEventError): void => {
              this.handleRoomError(message.canvasId, message.error);
            },
          )
          .exhaustive(),
      ).catch((error: unknown): void => {
        this._logger.error(
          this,
          `Error handling room service event: ${JSON.stringify(event)}`,
        );
        this._logger.error(this, error);
      });
    });
  }

  private _registerDatabaseServiceEvents(): void {
    this._databaseService.onNoteChanges$.subscribe(
      (message: { projectId: string }): void => {
        (async (): Promise<void> => {
          const project: Result<'api::v2-project.v2-project'> | null =
            await this._databaseService.getProject(message.projectId);
          if (project == null) {
            this._logger.error(
              this,
              'Cannot handle note change. Project not found.',
            );
            return;
          }
          const rooms: Result<'api::v2-room.v2-room'>[] =
            await this._databaseService.getRoomsOfProject(project);
          for (const room of rooms) {
            const canvases: Result<'api::v2-canvas.v2-canvas'>[] =
              await this._databaseService.getCanvasesOfRoom(room);
            for (const canvas of canvases) {
              const graph: MutableGraph = this._canvasService.getGraph(canvas);
              const notes: IndexedNoteCollection =
                await this._databaseService.getNotes({
                  project: project,
                  graph: graph,
                });

              const graphElements: SchemaGraphElements =
                await this._schemaFactory.createSchemaGraphElements(
                  graph,
                  notes,
                  canvas,
                );
              this.sendToRoom(canvas.documentId, {
                elements: graphElements,
                type: 'WSEventGraphElementsChanged',
              });
            }
          }
        })().catch((error: unknown): void => {
          this._logger.error(this, error);
        });
      },
    );
  }

  private async _assertRoom(
    client: WSClient,
  ): Promise<Result<'api::v2-canvas.v2-canvas'>> {
    if (client.room == null) {
      throw new Error(`Client ${client.id} is in no room.`);
    }
    const canvas: Result<'api::v2-canvas.v2-canvas'> | null =
      await this._databaseService.getCanvas(client.room);
    if (canvas == null) {
      throw new Error(
        `Cannot find canvas ${client.room} of client ${client.id}`,
      );
    }
    return canvas;
  }

  private _userCountOfRoom(roomId: string): number {
    return this._sockets.filter(
      (wsclient: WSClient): boolean => wsclient.room === roomId,
    ).size;
  }
}
