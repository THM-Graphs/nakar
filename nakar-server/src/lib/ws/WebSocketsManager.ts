import {
  DisconnectReason,
  Server as UntypedServer,
  Socket as UntypedSocket,
} from 'socket.io';
import { Core } from '@strapi/strapi';
import {
  SchemaWsActionGrabNode,
  SchemaWsActionJoinRoom,
  SchemaWsActionLoadScenario,
  SchemaWsActionMoveNodes,
  SchemaWsActionUngrabNode,
  SchemaWsClientToServerMessage,
  SchemaWsEventNotification,
  SchemaWsServerToClientMessage,
} from '../../../src-gen/schema';
import { match, P } from 'ts-pattern';
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
  private readonly _onLoadScenario: Subject<
    [WSClient, SchemaWsActionLoadScenario]
  >;
  private readonly _onGrabNode: Subject<[WSClient, SchemaWsActionGrabNode]>;
  private readonly _onMoveNodes: Subject<[WSClient, SchemaWsActionMoveNodes]>;
  private readonly _onUngrabNode: Subject<[WSClient, SchemaWsActionUngrabNode]>;

  private readonly _io: Server;

  public constructor(strapi: Core.Strapi) {
    this._sockets = new SSet();
    this._onSocketConnect = new Subject<WSClient>();
    this._onSocketDisconnect = new Subject<[WSClient, DisconnectReason]>();
    this._onJoinRoom = new Subject<[WSClient, SchemaWsActionJoinRoom]>();
    this._onLoadScenario = new Subject<
      [WSClient, SchemaWsActionLoadScenario]
    >();
    this._onGrabNode = new Subject<[WSClient, SchemaWsActionGrabNode]>();
    this._onMoveNodes = new Subject<[WSClient, SchemaWsActionMoveNodes]>();
    this._onUngrabNode = new Subject<[WSClient, SchemaWsActionUngrabNode]>();

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

      wsClient.onMessage$.subscribe(
        (message: SchemaWsClientToServerMessage): void => {
          try {
            match(message)
              .with(
                { type: 'WSActionJoinRoom' },
                (m: SchemaWsActionJoinRoom): void => {
                  this._onJoinRoom.next([wsClient, m]);
                },
              )
              .with(
                { type: 'WSActionLoadScenario' },
                (m: SchemaWsActionLoadScenario): void => {
                  this._onLoadScenario.next([wsClient, m]);
                },
              )
              .with(
                { type: 'WSActionGrabNode' },
                (m: SchemaWsActionGrabNode): void => {
                  this._onGrabNode.next([wsClient, m]);
                },
              )
              .with(
                { type: 'WSActionMoveNodes' },
                (m: SchemaWsActionMoveNodes): void => {
                  this._onMoveNodes.next([wsClient, m]);
                },
              )
              .with(
                { type: 'WSActionUngrabNode' },
                (m: SchemaWsActionUngrabNode): void => {
                  this._onUngrabNode.next([wsClient, m]);
                },
              )
              .exhaustive();
          } catch (error: unknown) {
            wsClient.send(this.createErrorNotification(error));
          }
        },
      );

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

  public get onLoadScenario$(): Observable<
    [WSClient, SchemaWsActionLoadScenario]
  > {
    return this._onLoadScenario.asObservable();
  }

  public get onGrabNode$(): Observable<[WSClient, SchemaWsActionGrabNode]> {
    return this._onGrabNode.asObservable();
  }

  public get onMoveNodes$(): Observable<[WSClient, SchemaWsActionMoveNodes]> {
    return this._onMoveNodes.asObservable();
  }

  public get onUngrabNode$(): Observable<[WSClient, SchemaWsActionUngrabNode]> {
    return this._onUngrabNode.asObservable();
  }

  public get sockets(): SSet<WSClient> {
    return this._sockets;
  }

  public sendToRoom(
    roomId: string,
    message: SchemaWsServerToClientMessage,
  ): void {
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
}
