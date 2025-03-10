import { Server, Socket } from './SocketIOInterface';
import {
  SchemaWsClientToServerMessage,
  SchemaWsServerToClientMessage,
} from '../../../../src-gen/schema';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { DisconnectReason } from 'socket.io';
import { LoggerService } from '../../services/logger/LoggerService';

export class WSClient {
  private _socket: Socket;
  private _server: Server;

  private readonly _room: BehaviorSubject<string | null>;
  private readonly _onMessage: Subject<SchemaWsClientToServerMessage>;
  private readonly _onDisconnect: Subject<DisconnectReason>;

  public constructor(
    socket: Socket,
    server: Server,
    private _logger: LoggerService,
  ) {
    this._socket = socket;
    this._server = server;

    this._room = new BehaviorSubject<string | null>(null);
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
        socket.removeAllListeners();
        this._onDisconnect.next(reason);
      });
  }

  public get id(): string {
    return this._socket.id;
  }

  public get room(): string | null {
    return this._room.getValue();
  }

  public get onRoomChanged$(): Observable<string | null> {
    return this._room.asObservable();
  }

  public get onMessage$(): Observable<SchemaWsClientToServerMessage> {
    return this._onMessage.asObservable();
  }

  public get onDisconnect$(): Observable<DisconnectReason> {
    return this._onDisconnect.asObservable();
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
    this._room.next(roomId);
  }

  public sendToRoom(message: SchemaWsServerToClientMessage): void {
    if (this.room == null) {
      return;
    }
    this._server.to(this.room).emit('message', message);
  }

  public broadcastToRoom(message: SchemaWsServerToClientMessage): void {
    if (this.room == null) {
      return;
    }
    this._socket.broadcast.to(this.room).emit('message', message);
  }
}
