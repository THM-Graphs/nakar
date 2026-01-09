import { io, Socket as UntypedSocket } from "socket.io-client";
import { Env } from "../env/env.ts";
import { ClientToServerEvents } from "./ClientToServerEvents.ts";
import { ServerToClientEvents } from "./ServerToClientEvents.ts";
import { WSServerToClientMessage } from "../../../src-gen";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { SocketState } from "./SocketState.ts";
import { ActionWsdto } from "../../../src-gen-2";

export type Socket = UntypedSocket<ServerToClientEvents, ClientToServerEvents>;

export class WebSocketsManager {
  private readonly socket: Socket;
  private readonly _socketState: BehaviorSubject<SocketState>;

  private readonly onMessage: Subject<WSServerToClientMessage>;

  public constructor(env: Env) {
    this.socket = io(env.BACKEND_SOCKET_URL);
    console.log(`Did connect WS to ${env.BACKEND_SOCKET_URL}`);
    this._socketState = new BehaviorSubject<SocketState>({
      type: "connecting",
    });

    this.onMessage = new Subject();

    this.socket.on("connect", () => {
      this._socketState.next({ type: "connected" });
    });
    this.socket.on("connect_error", (error: Error) => {
      this._socketState.next({ type: "connect_error", error: error });
    });
    this.socket.on("disconnect", () => {
      this._socketState.next({ type: "disconnect" });
      setTimeout(() => {
        this.socket.connect();
      }, 1000);
    });
    this.socket.on("message", (m) => {
      this.onMessage.next(m);
    });
  }

  public sendMessage(message: ActionWsdto["action"]): void {
    this.socket.emit("message", { action: message } satisfies ActionWsdto);
  }

  public get socketState(): SocketState {
    return this._socketState.getValue();
  }

  public get onSocketStateChanged$(): Observable<SocketState> {
    return this._socketState.asObservable();
  }

  public get onMessage$(): Observable<WSServerToClientMessage> {
    return this.onMessage.asObservable();
  }
}
