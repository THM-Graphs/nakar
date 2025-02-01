import { Server, Socket } from './WebSocketsManager';
import { match, P } from 'ts-pattern';
import {
  SchemaWsClientToServerMessage,
  SchemaWsServerToClientMessage,
} from '../../../src-gen/schema';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { DisconnectReason } from 'socket.io';

export class WSClient {
  private _socket: Socket;
  private _server: Server;

  private readonly _room = new BehaviorSubject<string | null>(null);
  private readonly _onMessage = new Subject<SchemaWsClientToServerMessage>();
  private readonly _onDisconnect = new Subject<DisconnectReason>();

  public constructor(socket: Socket, server: Server) {
    this._socket = socket;
    this._server = server;

    socket
      .on('message', (message: SchemaWsClientToServerMessage) => {
        this._onMessage.next(message);
      })
      .on('disconnecting', (reason: DisconnectReason) => {
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

  public sendError(error: unknown): void {
    const errorMessage: string = match(error)
      .with(P.instanceOf(Error), (e) => e.message)
      .otherwise((e) => JSON.stringify(e));
    this.send({
      type: 'WSEventNotification',
      severity: 'error',
      title: 'Error',
      message: errorMessage,
      date: new Date().toISOString(),
    });
  }

  public send(message: SchemaWsServerToClientMessage): void {
    this._socket.emit('message', message);
  }

  public async join(roomId: string): Promise<void> {
    const oldRoom = this.room;
    if (oldRoom === roomId) {
      return;
    }
    if (oldRoom != null) {
      await this._socket.leave(oldRoom);
      strapi.log.debug(
        `Socket ${this.id} had to leave room ${oldRoom} to join ${roomId}`,
      );
    }

    await this._socket.join(roomId);
    this._room.next(roomId);
  }

  public sendToRoom(message: SchemaWsServerToClientMessage): void {
    const roomId = this.room;
    if (roomId == null) {
      return;
    }
    this._server.to(roomId).emit('message', message);
  }

  public broadcastToRoom(message: SchemaWsServerToClientMessage): void {
    const roomId = this.room;
    if (roomId == null) {
      return;
    }
    this._socket.broadcast.to(roomId).emit('message', message);
  }
}
