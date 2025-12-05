import type { Server, Socket } from './SocketIOService';
import type {
  SchemaWsClientToServerMessage,
  SchemaWsServerToClientMessage,
} from '../../../src-gen/schema';
import type { Observable } from 'rxjs';
import { BehaviorSubject, distinctUntilChanged, Subject } from 'rxjs';
import type { DisconnectReason } from 'socket.io';
import type { LoggerService } from '../logger/LoggerService';

export class WSClient {
  private readonly _socket: Socket;
  private readonly _server: Server;

  private readonly _room: BehaviorSubject<[string | null, string | null]>;
  private readonly _onMessage: Subject<SchemaWsClientToServerMessage>;
  private readonly _onDisconnect: Subject<DisconnectReason>;

  public constructor(
    socket: Socket,
    server: Server,
    private readonly _logger: LoggerService,
  ) {
    this._socket = socket;
    this._server = server;

    this._room = new BehaviorSubject<[string | null, string | null]>([
      null,
      null,
    ]);
    this._onMessage = new Subject<SchemaWsClientToServerMessage>();
    this._onDisconnect = new Subject<DisconnectReason>();

    socket
      .on('message', (message: unknown): void => {
        try {
          const parsedMessage: unknown =
            typeof message === 'string' ? JSON.parse(message) : message;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          this._onMessage.next(parsedMessage as SchemaWsClientToServerMessage);
        } catch (error) {
          this._logger.error(this, error);
        }
      })
      .on('disconnecting', (reason: DisconnectReason): void => {
        void this.leaveRoom({ silent: true });
        socket.removeAllListeners();
        this._onDisconnect.next(reason);
      });
  }

  public get id(): string {
    return this._socket.id;
  }

  public get room(): string | null {
    return this._room.getValue()[1];
  }

  public get onRoomChanged$(): Observable<[string | null, string | null]> {
    return this._room.asObservable().pipe(distinctUntilChanged());
  }

  public get onMessage$(): Observable<SchemaWsClientToServerMessage> {
    return this._onMessage.asObservable();
  }

  public get onDisconnect$(): Observable<DisconnectReason> {
    return this._onDisconnect.asObservable();
  }

  public get native(): Socket {
    return this._socket;
  }

  public send(message: SchemaWsServerToClientMessage): void {
    this._socket.emit('message', message);
  }

  public async join(roomId: string): Promise<void> {
    if (this.room === roomId) {
      this._logger.warn(
        this,
        `Client ${this.id} wants to join a room, that they are already in: ${roomId}`,
      );
      return;
    }
    if (this.room != null) {
      this._logger.debug(
        this,
        `Socket ${this.id} will have to leave room ${this.room} to join ${roomId}`,
      );
      await this._socket.leave(this.room);
    }

    await this._socket.join(roomId);
    this._logger.debug(this, `Socket ${this.id} entered room ${roomId}`);
    this._room.next([this.room, roomId]);
  }

  public async leaveRoom(params: { silent: boolean }): Promise<void> {
    const roomId: string | null = this.room;
    if (roomId == null) {
      if (!params.silent) {
        this._logger.warn(
          this,
          `Client ${this.id} wants to leave a room, but i currently in no room.`,
        );
      }
      return;
    }

    await this._socket.leave(roomId);
    this._logger.debug(this, `Socket ${this.id} left room ${roomId}`);
    this._room.next([roomId, null]);
  }

  public sendToRoom(message: SchemaWsServerToClientMessage): void {
    if (this.room == null) {
      this._logger.error(
        this,
        `Cannot send message, because websocket is in no room: ${JSON.stringify(message)}`,
      );
      return;
    }
    this._server.to(this.room).emit('message', message);
  }

  public broadcastToRoom(message: SchemaWsServerToClientMessage): void {
    if (this.room == null) {
      this._logger.error(
        this,
        `Cannot send message, because websocket is in no room: ${JSON.stringify(message)}`,
      );
      return;
    }
    this._socket.broadcast.to(this.room).emit('message', message);
  }
}
