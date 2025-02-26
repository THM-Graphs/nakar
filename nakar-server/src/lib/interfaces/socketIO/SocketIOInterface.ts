import {
  DisconnectReason,
  Server as UntypedServer,
  Socket as UntypedSocket,
} from 'socket.io';
import {
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
import { RoomState } from '../../services/room/RoomState';
import { DatabaseService } from '../../services/database/DatabaseService';
import { DBRoom } from '../../services/database/collection-types/DBRoom';
import { RoomSessionManagerEventScenarioProgress } from '../../services/room/events/RoomSessionManagerEventScenarioProgress';
import { RoomSessionManagerEventRoomPhysicsUpdated } from '../../services/room/events/RoomSessionManagerEventRoomPhysicsUpdated';
import { MutableNode } from '../../services/room/graph/MutableNode';
import { RoomSessionManagerEventRoomUpdated } from '../../services/room/events/RoomSessionManagerEventRoomUpdated';
import { RoomStateData } from '../../services/room/RoomStateData';
import { MutableGraph } from '../../services/room/graph/MutableGraph';
import { DBScenario } from '../../services/database/collection-types/DBScenario';

export type Server = UntypedServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = UntypedSocket<ClientToServerEvents, ServerToClientEvents>;

export class SocketIOInterface {
  private readonly _sockets: SSet<WSClient>;
  private _io: UntypedServer | null;

  public constructor(
    private _roomService: RoomService,
    private _databaseService: DatabaseService,
  ) {
    this._sockets = new SSet();
    this._io = null;
  }

  public get sockets(): SSet<WSClient> {
    return this._sockets;
  }

  public bootstrap(): void {
    const io: UntypedServer = new UntypedServer(strapi.server.httpServer, {
      cors: {
        origin: '*',
      },
      path: '/frontend',
      serveClient: false,
    });
    this._io = io;
    io.on('connection', (s: Socket): void => {
      const wsClient: WSClient = new WSClient(s, io);
      this._sockets.add(wsClient);
      strapi.log.debug(`New socket ${wsClient.id} connection.`);

      wsClient.onRoomChanged$.subscribe((room: string | null): void => {
        wsClient.broadcastToRoom({
          type: 'WSEventNotification',
          title: 'User joined',
          message: `User ${wsClient.id} joined.`,
          severity: 'message',
          date: new Date().toISOString(),
        });

        if (room != null) {
          const roomState: RoomState = this._roomService.getRoom(room);
          if (roomState.type === 'data') {
            wsClient.send({
              graph: roomState.graph.toDto(),
              type: 'WSEventScenarioLoaded',
            });
          }
        }
      });

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
            strapi.log.error(
              `Unhandled ws message: ${JSON.stringify(clientToServerMessage)}`,
            );
          }
        },
      );

      wsClient.onDisconnect$.subscribe((reason: DisconnectReason): void => {
        strapi.log.debug(`Socket ${wsClient.id} disconnected: ${reason}`);
        wsClient.broadcastToRoom({
          type: 'WSEventNotification',
          title: 'User left',
          message: `User ${wsClient.id} left. Reason: ${reason}.`,
          date: new Date().toISOString(),
          severity: 'message',
        });
        this._sockets.delete(wsClient);
      });
    });

    this._roomService.onRoomPhysicsUpdated$.subscribe(
      (message: RoomSessionManagerEventRoomPhysicsUpdated): void => {
        this._handleRoomPhysicsUpdate(message);
      },
    );

    this._roomService.onRoomUpdated$.subscribe(
      (message: RoomSessionManagerEventRoomUpdated): void => {
        this._handleRoomUpdate(message);
      },
    );
  }

  public async destroy(): Promise<void> {
    if (this._io == null) {
      return;
    }
    strapi.log.debug('Will close web sockets connections');

    this._io.emit('message', {
      type: 'WSEventNotification',
      severity: 'error',
      message: 'The Server did shut down.',
      title: 'Server notification',
      date: new Date().toISOString(),
    } satisfies SchemaWsEventNotification);

    await this._io.close();
  }

  public sendToRoom(
    roomId: string,
    message: SchemaWsServerToClientMessage,
  ): void {
    if (this._io == null) {
      strapi.log.warn('IO is not defined!');
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
        strapi.log.error(`Room ${roomId} not found. Socket tried to join.`);
        return;
      }

      await wsClient.join(roomId);
      strapi.log.debug(`Socket ${wsClient.id} entered room ${roomId}`);
    })().catch(strapi.log.error);
  }

  private _handleLoadScenario(
    wsClient: WSClient,
    m: SchemaWsActionLoadScenario,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      strapi.log.error(
        `Socket ${wsClient.id} is in no room but did run a scenario.`,
      );
      return;
    }

    this._roomService
      .loadScenario({
        roomId: roomId,
        scenarioId: m.scenarioId,
        onProgrsss: (
          progress: RoomSessionManagerEventScenarioProgress,
        ): void => {
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
        this.createErrorNotification(error);
      })
      .then((): void => {
        wsClient.sendToRoom({
          type: 'WSEventScenarioProgress',
          message: null,
          progress: null,
        } satisfies SchemaWsEventScenarioProgress);
      })
      .catch((error: unknown): void => {
        this.createErrorNotification(error);
      });
  }

  private _handleGrabNode(
    wsClient: WSClient,
    message: SchemaWsActionGrabNode,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      strapi.log.error(
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
      strapi.log.error(
        `Socket ${wsClient.id} did send move node message but is in no room.`,
      );
      return;
    }

    this._roomService.moveNodes(roomId, m.nodes);
  }

  private _handleUngrabNode(
    wsClient: WSClient,
    m: SchemaWsActionUngrabNode,
  ): void {
    const roomId: string | null = wsClient.room;
    if (roomId == null) {
      strapi.log.error(
        `Socket ${wsClient.id} did send ungrab node message but is in no room.`,
      );
      return;
    }

    this._roomService.ungrabNode({
      nodeId: m.nodeId,
      roomId: roomId,
      userId: wsClient.id,
    });

    this._roomService.saveRoom(roomId);
  }

  private _handleRoomPhysicsUpdate(
    message: RoomSessionManagerEventRoomPhysicsUpdated,
  ): void {
    for (const socket of this.sockets) {
      if (socket.room !== message.roomId) {
        continue;
      }

      interface CompactNode {
        id: string;
        position: {
          x: number;
          y: number;
        };
      }
      const nodesToSend: CompactNode[] = message.graph.nodes
        .filter((n: MutableNode): boolean => !n.grabs.has(socket.id))
        .toArray()
        .map(
          ([id, node]: [string, MutableNode]): CompactNode => ({
            id: id,
            position: { x: node.position.x, y: node.position.y },
          }),
        );
      socket.send({
        type: 'WSEventNodesMoved',
        nodes: nodesToSend,
        date: new Date().toISOString(),
      });
    }
  }

  private _handleRoomUpdate(message: RoomSessionManagerEventRoomUpdated): void {
    const state: RoomState = this._roomService.getRoom(message.roomId);
    match(state)
      .with({ type: 'data' }, (data: RoomStateData): void => {
        this.sendToRoom(message.roomId, {
          graph: data.graph.toDto(),
          type: 'WSEventScenarioLoaded',
        });
      })
      .with({ type: 'empty' }, (): void => {
        this.sendToRoom(message.roomId, {
          graph: MutableGraph.empty().toDto(),
          type: 'WSEventScenarioLoaded',
        });
      })
      .exhaustive();
  }
}
