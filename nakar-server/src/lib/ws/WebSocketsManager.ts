import { DisconnectReason, Server as UntypedServer, Socket as UntypedSocket } from 'socket.io';
import { Core } from '@strapi/strapi';
import {
  SchemaWsActionJoinRoom,
  SchemaWsActionLockNode,
  SchemaWsActionMoveNodes,
  SchemaWsActionRunScenario,
  SchemaWsActionUnlockNode,
  SchemaWsClientToServerMessage,
  SchemaWsServerToClientMessage,
} from '../../../src-gen/schema';
import { match } from 'ts-pattern';
import { ServerToClientEvents } from './ServerToClientEvents';
import { ClientToServerEvents } from './ClientToServerEvents';
import { Observable, Subject } from 'rxjs';
import { WSClient } from './WSClient';
import { SSet } from '../tools/Set';

export type Server = UntypedServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = UntypedSocket<ClientToServerEvents, ServerToClientEvents>;

export class WebSocketsManager {
  private readonly _sockets: SSet<WSClient>;
  private readonly _onSocketConnect: Subject<WSClient>;
  private readonly _onSocketDisconnect: Subject<[WSClient, DisconnectReason]>;
  private readonly _onJoinRoom: Subject<[WSClient, SchemaWsActionJoinRoom]>;
  private readonly _onRunScenario: Subject<[WSClient, SchemaWsActionRunScenario]>;
  private readonly _onLockNode: Subject<[WSClient, SchemaWsActionLockNode]>;
  private readonly _onMoveNodes: Subject<[WSClient, SchemaWsActionMoveNodes]>;
  private readonly _onUnlockNode: Subject<[WSClient, SchemaWsActionUnlockNode]>;

  private readonly _io: Server;

  public constructor(strapi: Core.Strapi) {
    this._sockets = new SSet();
    this._onSocketConnect = new Subject<WSClient>();
    this._onSocketDisconnect = new Subject<[WSClient, DisconnectReason]>();
    this._onJoinRoom = new Subject<[WSClient, SchemaWsActionJoinRoom]>();
    this._onRunScenario = new Subject<[WSClient, SchemaWsActionRunScenario]>();
    this._onLockNode = new Subject<[WSClient, SchemaWsActionLockNode]>();
    this._onMoveNodes = new Subject<[WSClient, SchemaWsActionMoveNodes]>();
    this._onUnlockNode = new Subject<[WSClient, SchemaWsActionUnlockNode]>();

    this._io = new UntypedServer(strapi.server.httpServer, {
      cors: {
        origin: '*',
      },
      path: '/frontend',
      serveClient: false,
    });
    this._io.on('connection', (s: Socket): void => {
      const wsClient: WSClient = new WSClient(s, this._io);
      this._sockets.add(wsClient);
      strapi.log.debug(`New socket ${wsClient.id} connection.`);
      this._onSocketConnect.next(wsClient);

      wsClient.onMessage$.subscribe((message: SchemaWsClientToServerMessage): void => {
        try {
          match(message)
            .with({ type: 'WSActionJoinRoom' }, (m: SchemaWsActionJoinRoom): void => {
              this._onJoinRoom.next([wsClient, m]);
            })
            .with({ type: 'WSActionRunScenario' }, (m: SchemaWsActionRunScenario): void => {
              this._onRunScenario.next([wsClient, m]);
            })
            .with({ type: 'WSActionLockNode' }, (m: SchemaWsActionLockNode): void => {
              this._onLockNode.next([wsClient, m]);
            })
            .with({ type: 'WSActionMoveNodes' }, (m: SchemaWsActionMoveNodes): void => {
              this._onMoveNodes.next([wsClient, m]);
            })
            .with({ type: 'WSActionUnlockNode' }, (m: SchemaWsActionUnlockNode): void => {
              this._onUnlockNode.next([wsClient, m]);
            })
            .exhaustive();
        } catch (error: unknown) {
          wsClient.sendError(error);
        }
      });

      wsClient.onDisconnect$.subscribe((reason: DisconnectReason): void => {
        strapi.log.debug(`Socket ${wsClient.id} disconnected: ${reason}`);
        this._onSocketDisconnect.next([wsClient, reason]);
        this._sockets.delete(wsClient);
      });
    });
  }

  public get onSocketConnect$(): Observable<WSClient> {
    return this._onSocketConnect.asObservable();
  }

  public get onSocketDisconnect$(): Observable<[WSClient, DisconnectReason]> {
    return this._onSocketDisconnect.asObservable();
  }

  public get onJoinRoom$(): Observable<[WSClient, SchemaWsActionJoinRoom]> {
    return this._onJoinRoom.asObservable();
  }

  public get onRunScenario$(): Observable<[WSClient, SchemaWsActionRunScenario]> {
    return this._onRunScenario.asObservable();
  }

  public get onLockNode$(): Observable<[WSClient, SchemaWsActionLockNode]> {
    return this._onLockNode.asObservable();
  }

  public get onMoveNodes$(): Observable<[WSClient, SchemaWsActionMoveNodes]> {
    return this._onMoveNodes.asObservable();
  }

  public get onUnlockNode$(): Observable<[WSClient, SchemaWsActionUnlockNode]> {
    return this._onUnlockNode.asObservable();
  }

  public get sockets(): SSet<WSClient> {
    return this._sockets;
  }

  public sendToRoom(roomId: string, message: SchemaWsServerToClientMessage): void {
    this._io.to(roomId).emit('message', message);
  }
}
