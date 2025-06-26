import {
  DisconnectReason,
  Server as UntypedServer,
  Socket as UntypedSocket,
} from 'socket.io';
import {
  SchemaGraphElements,
  SchemaGraphMetaData,
  SchemaGraphTable,
  SchemaPhysicalNode,
  SchemaWsActionGrabNode,
  SchemaWsActionJoinRoom,
  SchemaWsActionMoveNodes,
  SchemaWsActionUngrabNode,
  SchemaWsClientToServerMessage,
  SchemaWsEventClearProgress,
  SchemaWsEventLockUi,
  SchemaWsEventNotification,
  SchemaWsEventPerformanceChanged,
  SchemaWsEventProgress,
  SchemaWsEventRoomChanged,
  SchemaWsEventSetNodeLocks,
  SchemaWsEventUnlockUi,
  SchemaWsServerToClientMessage,
} from '../../../../src-gen/schema';
import { match, P } from 'ts-pattern';
import { ServerToClientEvents } from './ServerToClientEvents';
import { ClientToServerEvents } from './ClientToServerEvents';
import { WSClient } from './WSClient';
import { SSet } from '../../tools/Set';
import { RoomService } from '../room/RoomService';
import { DatabaseService } from '../database/DatabaseService';
import { GetRoomDBDTO } from '../database/dto/GetRoomDBDTO';
import { LoggerService } from '../logger/LoggerService';
import http from 'http';
import { ApplicationService } from '../../application/ApplicationService';
import { Subscription } from 'rxjs';
import { HTTPService } from '../http/HTTPService';
import { CachingSchemaDTOFactory } from '../http/CachingSchemaDTOFactory';
import { RoomServiceEvent } from '../room/events/RoomServiceEvent';
import { RoomServiceEventGraphMetaDataChanged } from '../room/events/RoomServiceEventGraphMetaDataChanged';
import { RoomServiceEventRoomPhysicsUpdated } from '../room/events/RoomServiceEventRoomPhysicsUpdated';
import { RoomServiceEventNodeLocksUpdated } from '../room/events/RoomServiceEventNodeLocksUpdated';
import { RoomServiceEventRoomPerformanceChanged } from '../room/events/RoomServiceEventRoomPerformanceChanged';
import { RoomServiceEventRoomUnlocked } from '../room/events/RoomServiceEventRoomUnlocked';
import { RoomServiceEventRoomLocked } from '../room/events/RoomServiceEventRoomLocked';
import { RoomServiceEventProgressChanged } from '../room/events/RoomServiceEventProgressChanged';
import { RoomServiceEventProgressCleared } from '../room/events/RoomServiceEventProgressCleared';
import { RoomServiceEventGraphElementsChanged } from '../room/events/RoomServiceEventGraphElementsChanged';
import { RoomServiceEventGraphTableChanged } from '../room/events/RoomServiceEventGraphTableChanged';
import { ConfigService } from '../config/ConfigService';

export type Server = UntypedServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = UntypedSocket<ClientToServerEvents, ServerToClientEvents>;

export class SocketIOService implements ApplicationService {
  private readonly _sockets: SSet<WSClient>;
  private _io: UntypedServer | null;

  public constructor(
    private _roomService: RoomService,
    private _databaseService: DatabaseService,
    private _httpService: HTTPService,
    private _logger: LoggerService,
    private _config: ConfigService,
  ) {
    this._sockets = new SSet();
    this._io = null;
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
    this._registerRoomServiceEvents();
  }

  public destroy(): void {
    if (this._io == null) {
      return;
    }

    this._io.emit('message', {
      type: 'WSEventNotification',
      notification: {
        severity: 'error',
        message: 'The Server did shut down.',
        title: 'Server notification',
        date: new Date().toISOString(),
      },
    } satisfies SchemaWsEventNotification);
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
        title: 'Error',
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
          const oldRoomId: string | null = roomChange[0];
          const newRoomId: string | null = roomChange[1];

          if (oldRoomId != null && newRoomId == null) {
            this.sendToRoom(oldRoomId, {
              type: 'WSEventNotification',
              notification: {
                title: 'User left',
                message: `User ${wsClient.id} left.`,
                date: new Date().toISOString(),
                severity: 'message',
              },
            } satisfies SchemaWsEventNotification);
          } else if (oldRoomId == null && newRoomId != null) {
            wsClient.broadcastToRoom({
              type: 'WSEventNotification',
              notification: {
                title: 'User joined',
                message: `User ${wsClient.id} joined.`,
                severity: 'message',
                date: new Date().toISOString(),
              },
            });
          }

          wsClient.send({
            type: 'WSEventRoomChanged',
            roomId: newRoomId,
          } satisfies SchemaWsEventRoomChanged);
        },
      ),
      wsClient.onMessage$.subscribe(
        (clientToServerMessage: SchemaWsClientToServerMessage): void => {
          (async (): Promise<void> => {
            try {
              await match(clientToServerMessage)
                .returnType<void | Promise<void>>()
                .with(
                  { type: 'WSActionJoinRoom' },
                  async (m: SchemaWsActionJoinRoom): Promise<void> => {
                    const roomId: string = m.roomId;

                    const room: GetRoomDBDTO | null =
                      await this._databaseService.getRoom(roomId);
                    if (room == null) {
                      throw new Error(
                        `Room ${roomId} not found. Socket tried to join.`,
                      );
                    }

                    await wsClient.join(roomId);
                  },
                )
                .with(
                  { type: 'WSActionLeaveRoom' },
                  async (): Promise<void> => {
                    await wsClient.leaveRoom();
                  },
                )
                .with(
                  { type: 'WSActionGrabNode' },
                  (m: SchemaWsActionGrabNode): void => {
                    const roomId: string = this._assertRoom(wsClient);
                    this._roomService.grabNode({
                      nodeId: m.nodeId,
                      roomId: roomId,
                      userId: wsClient.id,
                    });
                  },
                )
                .with(
                  { type: 'WSActionMoveNodes' },
                  (m: SchemaWsActionMoveNodes): void => {
                    const roomId: string = this._assertRoom(wsClient);
                    this._roomService.moveNodes({
                      roomId: roomId,
                      nodes: m.nodes,
                      userId: wsClient.id,
                    });
                  },
                )
                .with(
                  { type: 'WSActionUngrabNode' },
                  (m: SchemaWsActionUngrabNode): void => {
                    const roomId: string = this._assertRoom(wsClient);
                    this._roomService.ungrabNode({
                      node: m.node,
                      roomId: roomId,
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
        for (const sub of clientSubscriptions) {
          sub.unsubscribe();
        }
      }),
    ];
  }

  private _registerRoomServiceEvents(): void {
    this._roomService.onEvent$.subscribe((event: RoomServiceEvent): void => {
      Promise.resolve(
        match(event)
          .returnType<void | Promise<void>>()
          .with(
            { type: 'RoomServiceEventGraphTableChanged' },
            (message: RoomServiceEventGraphTableChanged): void => {
              const cachedGraphFactory: CachingSchemaDTOFactory =
                new CachingSchemaDTOFactory(
                  this._databaseService,
                  this._logger,
                  this._config,
                );
              const table: SchemaGraphTable =
                cachedGraphFactory.createSchemaTable(message.table);
              this.sendToRoom(message.roomId, {
                table: table,
                type: 'WSEventGraphTableChanged',
              });
            },
          )
          .with(
            { type: 'RoomServiceEventGraphMetaDataChanged' },
            async (
              message: RoomServiceEventGraphMetaDataChanged,
            ): Promise<void> => {
              const cachedGraphFactory: CachingSchemaDTOFactory =
                new CachingSchemaDTOFactory(
                  this._databaseService,
                  this._logger,
                  this._config,
                );
              const metaData: SchemaGraphMetaData =
                await cachedGraphFactory.createSchemaGraphMetaData(
                  message.metaData,
                );
              this.sendToRoom(message.roomId, {
                metaData: metaData,
                type: 'WSEventGraphMetaDataChanged',
              });
            },
          )
          .with(
            { type: 'RoomServiceEventGraphElementsChanged' },
            (message: RoomServiceEventGraphElementsChanged): void => {
              const cachedGraphFactory: CachingSchemaDTOFactory =
                new CachingSchemaDTOFactory(
                  this._databaseService,
                  this._logger,
                  this._config,
                );
              cachedGraphFactory
                .createSchemaGraphElements(message.graph)
                .then((graphElements: SchemaGraphElements): void => {
                  this.sendToRoom(message.roomId, {
                    elements: graphElements,
                    type: 'WSEventGraphElementsChanged',
                  });
                })
                .catch((error: unknown): void => {
                  this._logger.error(this, error);
                });
            },
          )
          .with(
            { type: 'RoomServiceEventRoomPhysicsUpdated' },
            (message: RoomServiceEventRoomPhysicsUpdated): void => {
              for (const socket of this.sockets) {
                if (socket.room !== message.roomId) {
                  continue;
                }

                const nodesToSend: SchemaPhysicalNode[] = [];
                for (const node of message.graph.nodes.nodes) {
                  if (!node.grabs.has(socket.id)) {
                    nodesToSend.push({
                      id: node.id,
                      position: { x: node.position.x, y: node.position.y },
                    });
                  }
                }

                socket.send({
                  type: 'WSEventNodesMoved',
                  nodes: nodesToSend,
                  date: new Date().toISOString(),
                });
              }
            },
          )
          .with(
            { type: 'RoomServiceEventNodeLocksUpdated' },
            (message: RoomServiceEventNodeLocksUpdated): void => {
              const locks: { id: string; locked: boolean }[] = [];
              for (const lock of message.locks.entries()) {
                locks.push({
                  id: lock[0],
                  locked: lock[1],
                });
              }
              this.sendToRoom(message.roomId, {
                type: 'WSEventSetNodeLocks',
                locks: locks,
              } satisfies SchemaWsEventSetNodeLocks);
            },
          )
          .with(
            { type: 'RoomServiceEventRoomPerformanceChanged' },
            (message: RoomServiceEventRoomPerformanceChanged): void => {
              this.sendToRoom(message.roomId, {
                type: 'WSEventPerformanceChanged',
                performance: message.performance ?? undefined,
              } satisfies SchemaWsEventPerformanceChanged);
            },
          )
          .with(
            { type: 'RoomServiceEventRoomLocked' },
            (message: RoomServiceEventRoomLocked): void => {
              this.sendToRoom(message.roomId, {
                type: 'WSEventLockUi',
              } satisfies SchemaWsEventLockUi);
            },
          )
          .with(
            { type: 'RoomServiceEventRoomUnlocked' },
            (message: RoomServiceEventRoomUnlocked): void => {
              this.sendToRoom(message.roomId, {
                type: 'WSEventUnlockUi',
              } satisfies SchemaWsEventUnlockUi);
            },
          )
          .with(
            { type: 'RoomServiceEventProgressChanged' },
            (message: RoomServiceEventProgressChanged): void => {
              this.sendToRoom(message.roomId, {
                type: 'WSEventProgress',
                message: message.message,
                progress: message.progress,
              } satisfies SchemaWsEventProgress);
            },
          )
          .with(
            { type: 'RoomServiceEventProgressCleared' },
            (message: RoomServiceEventProgressCleared): void => {
              this.sendToRoom(message.roomId, {
                type: 'WSEventClearProgress',
              } satisfies SchemaWsEventClearProgress);
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

  private _assertRoom(client: WSClient): string {
    if (client.room == null) {
      throw new Error(`Client ${client.id} is in no room.`);
    }
    return client.room;
  }
}
