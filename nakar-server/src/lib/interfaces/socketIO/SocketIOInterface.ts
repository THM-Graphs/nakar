import {
  DisconnectReason,
  Server as UntypedServer,
  Socket as UntypedSocket,
} from 'socket.io';
import {
  SchemaPhysicalNode,
  SchemaWsActionGrabNode,
  SchemaWsActionJoinRoom,
  SchemaWsActionLoadScenario,
  SchemaWsActionMoveNodes,
  SchemaWsActionUngrabNode,
  SchemaWsClientToServerMessage,
  SchemaWsEventNotification,
  SchemaWsEventScenarioProgress,
  SchemaWsServerToClientMessage,
} from '../../../../src-gen/schema';
import { match, P } from 'ts-pattern';
import { ServerToClientEvents } from './ServerToClientEvents';
import { ClientToServerEvents } from './ClientToServerEvents';
import { WSClient } from './WSClient';
import { SSet } from '../../tools/Set';
import { RoomService } from '../../services/room/RoomService';
import { DatabaseService } from '../../services/database/DatabaseService';
import { DBRoom } from '../../services/database/collection-types/DBRoom';
import { RSEventScenarioProgress } from '../../services/room/events/RSEventScenarioProgress';
import { RSEventRoomPhysicsUpdated } from '../../services/room/events/RSEventRoomPhysicsUpdated';
import { RSEventRoomUpdated } from '../../services/room/events/RSEventRoomUpdated';
import { DBScenario } from '../../services/database/collection-types/DBScenario';
import { HTTPInterface } from '../http/HTTPInterface';
import { LoggerService } from '../../services/logger/LoggerService';
import http from 'http';
import { ApplicationService } from '../../application/ApplicationService';
import { MutableGraph } from '../../services/room/graph/MutableGraph';
import z from 'zod';
import { Subscription } from 'rxjs';

export type Server = UntypedServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = UntypedSocket<ClientToServerEvents, ServerToClientEvents>;

export class SocketIOInterface implements ApplicationService {
  private readonly _sockets: SSet<WSClient>;
  private _io: UntypedServer | null;

  public constructor(
    private _roomService: RoomService,
    private _databaseService: DatabaseService,
    private _httpInterface: HTTPInterface,
    private _logger: LoggerService,
  ) {
    this._sockets = new SSet();
    this._io = null;
  }

  public get sockets(): SSet<WSClient> {
    return this._sockets;
  }

  public bootstrap(): void {
    const httpServer: http.Server = this._httpInterface.getServerInstance();

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

          if (roomId != null) {
            const plainGraph: z.infer<typeof MutableGraph.schema> | null =
              this._roomService.getGraph(roomId);
            const graph: MutableGraph = plainGraph
              ? MutableGraph.fromPlain(plainGraph)
              : MutableGraph.empty();
            wsClient.send({
              type: 'WSEventScenarioLoaded',
              graph: graph.toDto(),
            });
          }
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

      const room: DBRoom | null = await this._databaseService.getRoom(roomId);

      if (room == null) {
        this._logger.error(
          this,
          `Room ${roomId} not found. Socket tried to join.`,
        );
        return;
      }

      await wsClient.join(roomId);
      this._logger.debug(this, `Socket ${wsClient.id} entered room ${roomId}`);
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
      .then((scenario: DBScenario): void => {
        wsClient.sendToRoom({
          title: 'Scenario',
          message: `Scenario "${scenario.title ?? ''}" started.`,
          date: new Date().toISOString(),
          severity: 'message',
          type: 'WSEventNotification',
        });
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
      nodeId: m.nodeId,
      roomId: roomId,
      userId: wsClient.id,
    });
  }

  private _handleRoomPhysicsUpdate(message: RSEventRoomPhysicsUpdated): void {
    for (const socket of this.sockets) {
      if (socket.room !== message.roomId) {
        continue;
      }

      const nodesToSend: SchemaPhysicalNode[] = [];
      for (const [id, node] of Object.entries(message.graph.nodes)) {
        if (!node.grabs.includes(socket.id)) {
          nodesToSend.push({
            id: id,
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
    this.sendToRoom(message.roomId, {
      graph: message.graph.toDto(),
      type: 'WSEventScenarioLoaded',
    });
  }
}
