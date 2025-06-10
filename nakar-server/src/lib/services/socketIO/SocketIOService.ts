import {
  DisconnectReason,
  Server as UntypedServer,
  Socket as UntypedSocket,
} from 'socket.io';
import {
  SchemaGraph,
  SchemaPhysicalNode,
  SchemaWsActionDeleteNodes,
  SchemaWsActionExpandNodes,
  SchemaWsActionGetGraph,
  SchemaWsActionGrabNode,
  SchemaWsActionJoinRoom,
  SchemaWsActionLoadScenario,
  SchemaWsActionMoveNodes,
  SchemaWsActionUngrabNode,
  SchemaWsActionUnlockNodes,
  SchemaWsClientToServerMessage,
  SchemaWsEventNotification,
  SchemaWsEventRoomChanged,
  SchemaWsEventScenarioProgress,
  SchemaWsEventSetLocks,
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
import { RSEventScenarioProgress } from '../room/events/RSEventScenarioProgress';
import { RSEventRoomPhysicsUpdated } from '../room/events/RSEventRoomPhysicsUpdated';
import { RSEventRoomUpdated } from '../room/events/RSEventRoomUpdated';
import { LoggerService } from '../logger/LoggerService';
import http from 'http';
import { ApplicationService } from '../../application/ApplicationService';
import { MutableGraph } from '../room/graph/MutableGraph';
import { Subscription } from 'rxjs';
import { HTTPService } from '../http/HTTPService';
import { CachingSchemaDTOFactory } from '../http/CachingSchemaDTOFactory';
import { RSExpandNodesResult } from '../room/events/RSExpandNodesResult';
import { RSEventRoomLocksUpdated } from '../room/events/RSEventRoomLocksUpdated';

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

    io.on('connection', (s: Socket): void => {
      const wsClient: WSClient = new WSClient(s, io, this._logger);
      this._sockets.add(wsClient);
      this._logger.debug(this, `New socket ${wsClient.id} connection.`);
      const clientSubscriptions: Subscription[] = [];

      clientSubscriptions.push(
        wsClient.onRoomChanged$.subscribe((roomId: string | null): void => {
          wsClient.broadcastToRoom({
            type: 'WSEventNotification',
            title: 'User joined',
            message: `User ${wsClient.id} joined.`,
            severity: 'message',
            date: new Date().toISOString(),
          });
          wsClient.send({
            type: 'WSEventRoomChanged',
            roomId: roomId,
          } satisfies SchemaWsEventRoomChanged);
        }),
      );

      clientSubscriptions.push(
        wsClient.onMessage$.subscribe(
          (clientToServerMessage: SchemaWsClientToServerMessage): void => {
            try {
              match(clientToServerMessage)
                .with(
                  { type: 'WSActionJoinRoom' },
                  (m: SchemaWsActionJoinRoom): void => {
                    this._handleJoinRoom(wsClient, m);
                  },
                )
                .with(
                  { type: 'WSActionLoadScenario' },
                  (m: SchemaWsActionLoadScenario): void => {
                    this._handleLoadScenario(wsClient, m);
                  },
                )
                .with(
                  { type: 'WSActionGrabNode' },
                  (m: SchemaWsActionGrabNode): void => {
                    this._handleGrabNode(wsClient, m);
                  },
                )
                .with(
                  { type: 'WSActionMoveNodes' },
                  (m: SchemaWsActionMoveNodes): void => {
                    this._handleMoveNodes(wsClient, m);
                  },
                )
                .with(
                  { type: 'WSActionUngrabNode' },
                  (m: SchemaWsActionUngrabNode): void => {
                    this._handleUngrabNode(wsClient, m);
                  },
                )
                .with(
                  { type: 'WSActionExpandNodes' },
                  (m: SchemaWsActionExpandNodes): void => {
                    this._handleExpandNodes(wsClient, m);
                  },
                )
                .with(
                  { type: 'WSActionDeleteNodes' },
                  (m: SchemaWsActionDeleteNodes): void => {
                    this._handleDeleteNodes(wsClient, m);
                  },
                )
                .with({ type: 'WSActionRelayout' }, (): void => {
                  this._handleRelayout(wsClient);
                })
                .with(
                  { type: 'WSActionUnlockNodes' },
                  (message: SchemaWsActionUnlockNodes): void => {
                    this._handleUnlockNodes(wsClient, message);
                  },
                )
                .with({ type: 'WSActionGetGraph' }, (): void => {
                  this._handleGetGraph(wsClient);
                })
                .exhaustive();
            } catch (error: unknown) {
              wsClient.send(this.createErrorNotification(error));
              this._logger.error(
                this,
                `Unhandled ws message: ${JSON.stringify(clientToServerMessage)}`,
              );
            }
          },
        ),
      );

      clientSubscriptions.push(
        wsClient.onDisconnect$.subscribe((reason: DisconnectReason): void => {
          this._logger.debug(
            this,
            `Socket ${wsClient.id} disconnected: ${reason}`,
          );
          wsClient.broadcastToRoom({
            type: 'WSEventNotification',
            title: 'User left',
            message: `User ${wsClient.id} left. Reason: ${reason}.`,
            date: new Date().toISOString(),
            severity: 'message',
          });
          this._sockets.delete(wsClient);
          for (const sub of clientSubscriptions) {
            sub.unsubscribe();
          }
        }),
      );
    });

    this._roomService.onRoomPhysicsUpdated$.subscribe(
      (message: RSEventRoomPhysicsUpdated): void => {
        this._handleRoomPhysicsUpdate(message);
      },
    );

    this._roomService.onRoomUpdated$.subscribe(
      (message: RSEventRoomUpdated): void => {
        this._handleRoomUpdate(message);
      },
    );

    this._roomService.onRoomLocksUpdated$.subscribe(
      (message: RSEventRoomLocksUpdated): void => {
        this._handleRoomLocksUpdate(message);
      },
    );
  }

  public destroy(): void {
    if (this._io == null) {
      return;
    }

    this._io.emit('message', {
      type: 'WSEventNotification',
      severity: 'error',
      message: 'The Server did shut down.',
      title: 'Server notification',
      date: new Date().toISOString(),
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

  public createErrorNotification(error: unknown): SchemaWsEventNotification {
    const errorMessage: string = match(error)
      .with(P.instanceOf(Error), (e: Error): string => e.message)
      .otherwise((e: unknown): string => JSON.stringify(e));
    return {
      type: 'WSEventNotification',
      severity: 'error',
      title: 'Error',
      message: errorMessage,
      date: new Date().toISOString(),
    };
  }

  private _handleJoinRoom(
    wsClient: WSClient,
    message: SchemaWsActionJoinRoom,
  ): void {
    (async (): Promise<void> => {
      const roomId: string = message.roomId;

      const room: GetRoomDBDTO | null =
        await this._databaseService.getRoom(roomId);

      if (room == null) {
        this._logger.error(
          this,
          `Room ${roomId} not found. Socket tried to join.`,
        );
        return;
      }

      await wsClient.join(roomId);
    })().catch((error: unknown): void => {
      this._logger.error(this, error);
    });
  }

  private _handleLoadScenario(
    wsClient: WSClient,
    m: SchemaWsActionLoadScenario,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} is in no room but did run a scenario.`,
      );
      return;
    }

    this._roomService
      .loadScenario({
        roomId: roomId,
        scenarioId: m.scenarioId,
        onProgrsss: (progress: RSEventScenarioProgress): void => {
          wsClient.sendToRoom({
            type: 'WSEventScenarioProgress',
            message: progress.message,
            progress: progress.progress,
          } satisfies SchemaWsEventScenarioProgress);
        },
      })
      .catch((error: unknown): void => {
        wsClient.sendToRoom(this.createErrorNotification(error));
      })
      .then((): void => {
        wsClient.sendToRoom({
          type: 'WSEventScenarioProgress',
          message: null,
          progress: null,
        } satisfies SchemaWsEventScenarioProgress);
      })
      .catch((error: unknown): void => {
        wsClient.sendToRoom(this.createErrorNotification(error));
      });
  }

  private _handleGrabNode(
    wsClient: WSClient,
    message: SchemaWsActionGrabNode,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send grab node message but is in no room.`,
      );
      return;
    }
    const nodeId: string = message.nodeId;

    this._roomService.grabNode({
      nodeId: nodeId,
      roomId: roomId,
      userId: wsClient.id,
    });
  }

  private _handleMoveNodes(
    wsClient: WSClient,
    m: SchemaWsActionMoveNodes,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send move node message but is in no room.`,
      );
      return;
    }

    this._roomService.moveNodes({
      roomId: roomId,
      nodes: m.nodes,
      userId: wsClient.id,
    });
  }

  private _handleUngrabNode(
    wsClient: WSClient,
    m: SchemaWsActionUngrabNode,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send ungrab node message but is in no room.`,
      );
      return;
    }

    this._roomService.ungrabNode({
      node: m.node,
      roomId: roomId,
      userId: wsClient.id,
    });
  }

  private _handleExpandNodes(
    wsClient: WSClient,
    m: SchemaWsActionExpandNodes,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send expand nodes message but is in no room.`,
      );
      return;
    }

    wsClient.sendToRoom({
      type: 'WSEventScenarioProgress',
      message: 'Expanding node',
      progress: 0.1,
    } satisfies SchemaWsEventScenarioProgress);

    this._roomService
      .expandNodes({ roomId: roomId, nodeIds: m.nodes })
      .then((result: RSExpandNodesResult): void => {
        wsClient.sendToRoom({
          type: 'WSEventNotification',
          title: 'Nodes added',
          severity: 'message',
          message: `Did add ${result.newNodeCount.toString()} nodes and ${result.newEdgeCount.toString()} edges.`,
          date: new Date().toISOString(),
        } satisfies SchemaWsEventNotification);
      })
      .catch((error: unknown): void => {
        wsClient.sendToRoom(this.createErrorNotification(error));
      })
      .finally((): void => {
        wsClient.sendToRoom({
          type: 'WSEventScenarioProgress',
          message: null,
          progress: null,
        } satisfies SchemaWsEventScenarioProgress);
      });
  }

  private _handleDeleteNodes(
    wsClient: WSClient,
    m: SchemaWsActionDeleteNodes,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send expand nodes message but is in no room.`,
      );
      return;
    }

    wsClient.sendToRoom({
      type: 'WSEventScenarioProgress',
      message: 'Deleting node...',
      progress: 0.1,
    } satisfies SchemaWsEventScenarioProgress);

    try {
      this._roomService.deleteNodes({ roomId: roomId, nodeIds: m.nodes });
      wsClient.sendToRoom({
        type: 'WSEventNotification',
        title: 'Nodes deleted',
        severity: 'message',
        message: `Did delete nodes.`,
        date: new Date().toISOString(),
      } satisfies SchemaWsEventNotification);
    } catch (error: unknown) {
      wsClient.sendToRoom(this.createErrorNotification(error));
    }

    wsClient.sendToRoom({
      type: 'WSEventScenarioProgress',
      message: null,
      progress: null,
    } satisfies SchemaWsEventScenarioProgress);
  }

  private _handleRelayout(wsClient: WSClient): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send relayout but is in no room.`,
      );
      return;
    }
    this._roomService.relayout({ roomId: roomId });
  }

  private _handleUnlockNodes(
    wsClient: WSClient,
    message: SchemaWsActionUnlockNodes,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send unlock nodes but is in no room.`,
      );
      return;
    }
    this._roomService.unlockNodes({ roomId: roomId, nodeIds: message.nodes });
  }

  private _handleGetGraph(wsClient: WSClient): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      this._logger.error(
        this,
        `Socket ${wsClient.id} did send unlock nodes but is in no room.`,
      );
      return;
    }

    const graph: MutableGraph =
      this._roomService.getGraph(roomId) ?? MutableGraph.empty();
    const cachedGraphFactory: CachingSchemaDTOFactory =
      new CachingSchemaDTOFactory(this._databaseService, this._logger);
    cachedGraphFactory
      .createSchemaGraph(graph)
      .then((schemaGraph: SchemaGraph): void => {
        wsClient.send({
          type: 'WSEventGraphChanged',
          graph: schemaGraph,
        });
      })
      .catch((error: unknown): void => {
        this._logger.error(this, error);
      });
  }

  private _handleRoomPhysicsUpdate(message: RSEventRoomPhysicsUpdated): void {
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
  }

  private _handleRoomUpdate(message: RSEventRoomUpdated): void {
    const cachedGraphFactory: CachingSchemaDTOFactory =
      new CachingSchemaDTOFactory(this._databaseService, this._logger);
    cachedGraphFactory
      .createSchemaGraph(message.graph)
      .then((graph: SchemaGraph): void => {
        this.sendToRoom(message.roomId, {
          graph: graph,
          type: 'WSEventGraphChanged',
        });
      })
      .catch((error: unknown): void => {
        this._logger.error(this, error);
      });
  }

  private _handleRoomLocksUpdate(message: RSEventRoomLocksUpdated): void {
    const locks: { id: string; locked: boolean }[] = [];
    for (const lock of message.locks.entries()) {
      locks.push({
        id: lock[0],
        locked: lock[1],
      });
    }
    this.sendToRoom(message.roomId, {
      type: 'WSEventSetLocks',
      locks: locks,
    } satisfies SchemaWsEventSetLocks);
  }
}
