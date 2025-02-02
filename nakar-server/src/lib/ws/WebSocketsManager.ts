import {
  DisconnectReason,
  Server as UntypedServer,
  Socket as UntypedSocket,
} from 'socket.io';
import { Core } from '@strapi/strapi';
import {
  SchemaWsActionJoinRoom,
  SchemaWsActionMoveNodes,
  SchemaWsActionRunScenario,
  SchemaWsServerToClientMessage,
} from '../../../src-gen/schema';
import { match } from 'ts-pattern';
import { ServerToClientEvents } from './ServerToClientEvents';
import { ClientToServerEvents } from './ClientToServerEvents';
import { Observable, Subject } from 'rxjs';
import { WSClient } from './WSClient';

export type Server = UntypedServer<ClientToServerEvents, ServerToClientEvents>;
export type Socket = UntypedSocket<ClientToServerEvents, ServerToClientEvents>;

export class WebSocketsManager {
  private readonly _onSocketConnect = new Subject<WSClient>();
  private readonly _onSocketDisconnect = new Subject<
    [WSClient, DisconnectReason]
  >();
  private readonly _onJoinRoom = new Subject<
    [WSClient, SchemaWsActionJoinRoom]
  >();
  private readonly _onRunScenario = new Subject<
    [WSClient, SchemaWsActionRunScenario]
  >();
  private readonly _onMoveNodes = new Subject<
    [WSClient, SchemaWsActionMoveNodes]
  >();
  private readonly _io: Server;

  public constructor(strapi: Core.Strapi) {
    this._io = new UntypedServer(strapi.server.httpServer, {
      cors: {
        origin: '*',
      },
      path: '/frontend',
      serveClient: false,
    });
    this._io.on('connection', (s) => {
      const wsClient = new WSClient(s, this._io);
      strapi.log.debug(`New socket ${wsClient.id} connection.`);
      this._onSocketConnect.next(wsClient);

      wsClient.onMessage$.subscribe((message) => {
        try {
          match(message)
            .with({ type: 'WSActionJoinRoom' }, (m): void => {
              this._onJoinRoom.next([wsClient, m]);
            })
            .with({ type: 'WSActionRunScenario' }, (m): void => {
              this._onRunScenario.next([wsClient, m]);
            })
            .with({ type: 'WSActionMoveNodes' }, (m): void => {
              this._onMoveNodes.next([wsClient, m]);
            })
            .exhaustive();
        } catch (error: unknown) {
          wsClient.sendError(error);
        }
      });

      wsClient.onDisconnect$.subscribe((reason: DisconnectReason) => {
        strapi.log.debug(`Socket ${wsClient.id} disconnected: ${reason}`);
        this._onSocketDisconnect.next([wsClient, reason]);
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

  public get onRunScenario$(): Observable<
    [WSClient, SchemaWsActionRunScenario]
  > {
    return this._onRunScenario.asObservable();
  }

  public get onMoveNodes$(): Observable<[WSClient, SchemaWsActionMoveNodes]> {
    return this._onMoveNodes.asObservable();
  }

  public sendToRoom(
    roomId: string,
    message: SchemaWsServerToClientMessage,
  ): void {
    this._io.to(roomId).emit('message', message);
  }
}
