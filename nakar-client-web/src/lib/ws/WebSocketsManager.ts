import { io, Socket as UntypedSocket } from "socket.io-client";
import { Env } from "../env/env.ts";
import { ClientToServerEvents } from "./ClientToServerEvents.ts";
import { ServerToClientEvents } from "./ServerToClientEvents.ts";
import {
  WSClientToServerMessage,
  WSEventGraphProgress,
  WSEventNodesMoved,
  WSEventNotification,
  WSEventScenarioDataChanged,
  WSServerToClientMessage,
} from "../../../src-gen";
import { BehaviorSubject, Observable, Subject } from "rxjs";
import { SocketState } from "./SocketState.ts";
import { match } from "ts-pattern";

export type Socket = UntypedSocket<ServerToClientEvents, ClientToServerEvents>;

export class WebSocketsManager {
  private readonly socket: Socket;
  private readonly _socketState: BehaviorSubject<SocketState>;

  private readonly onNotification: Subject<WSEventNotification>;
  private readonly onNodesMoved: Subject<WSEventNodesMoved>;
  private readonly onScenarioDataChanged: Subject<WSEventScenarioDataChanged>;
  private readonly onGraphProgress: Subject<WSEventGraphProgress>;

  public constructor(env: Env) {
    console.log("Did create instance of WebSocketsManager");
    this.socket = io(env.BACKEND_SOCKET_URL, { path: "/frontend" });
    this._socketState = new BehaviorSubject<SocketState>({
      type: "connecting",
    });

    this.onNotification = new Subject();
    this.onNodesMoved = new Subject();
    this.onScenarioDataChanged = new Subject();
    this.onGraphProgress = new Subject();

    this.socket.on("connect", () => {
      this._socketState.next({ type: "connected" });
    });
    this.socket.on("connect_error", (error: Error) => {
      this._socketState.next({ type: "connect_error", error: error });
    });
    this.socket.on("disconnect", () => {
      this._socketState.next({ type: "disconnect" });
    });
    this.socket.on("message", (message: WSServerToClientMessage) => {
      match(message)
        .with({ type: "WSEventNotification" }, (m) => {
          this.onNotification.next(m);
        })
        .with({ type: "WSEventNodesMoved" }, (m) => {
          this.onNodesMoved.next(m);
        })
        .with({ type: "WSEventScenarioDataChanged" }, (m) => {
          this.onScenarioDataChanged.next(m);
        })
        .with({ type: "WSEventGraphProgress" }, (m) => {
          this.onGraphProgress.next(m);
        })
        .exhaustive();
    });
  }

  public sendMessage(message: WSClientToServerMessage): void {
    this.socket.emit("message", message);
  }

  public get socketState(): SocketState {
    return this._socketState.getValue();
  }

  public get onSocketStateChanged$(): Observable<SocketState> {
    return this._socketState.asObservable();
  }

  public get onNotification$(): Observable<WSEventNotification> {
    return this.onNotification.asObservable();
  }

  public get onNodesMoved$(): Observable<WSEventNodesMoved> {
    return this.onNodesMoved.asObservable();
  }

  public get onScenarioDataChanged$(): Observable<WSEventScenarioDataChanged> {
    return this.onScenarioDataChanged.asObservable();
  }

  public get onGraphProgress$(): Observable<WSEventGraphProgress> {
    return this.onGraphProgress.asObservable();
  }
}
