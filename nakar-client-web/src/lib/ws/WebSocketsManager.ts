import { io, Socket as UntypedSocket } from "socket.io-client";
import { Env } from "../env/env.ts";
import { ClientToServerEvents } from "./ClientToServerEvents.ts";
import { ServerToClientEvents } from "./ServerToClientEvents.ts";
import {
  WSClientToServerMessage,
  WSEventNodesMoved,
  WSEventNotification,
  WSEventGraphChanged,
  WSEventScenarioProgress,
  WSEventSetLocks,
  WSServerToClientMessage,
  WSEventRoomChanged,
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
  private readonly onGraphChanged: Subject<WSEventGraphChanged>;
  private readonly onScenarioProgress: Subject<WSEventScenarioProgress>;
  private readonly onSetLocks: Subject<WSEventSetLocks>;
  private readonly onRoomChanged: Subject<WSEventRoomChanged>;

  public constructor(env: Env) {
    this.socket = io(env.BACKEND_SOCKET_URL, { path: "/socket.io" });
    console.log(`Did connect WS to ${env.BACKEND_SOCKET_URL}`);
    this._socketState = new BehaviorSubject<SocketState>({
      type: "connecting",
    });

    this.onNotification = new Subject();
    this.onNodesMoved = new Subject();
    this.onGraphChanged = new Subject();
    this.onScenarioProgress = new Subject();
    this.onSetLocks = new Subject();
    this.onRoomChanged = new Subject();

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
        .with({ type: "WSEventGraphChanged" }, (m) => {
          this.onGraphChanged.next(m);
        })
        .with({ type: "WSEventScenarioProgress" }, (m) => {
          this.onScenarioProgress.next(m);
        })
        .with({ type: "WSEventSetLocks" }, (m) => {
          this.onSetLocks.next(m);
        })
        .with({ type: "WSEventRoomChanged" }, (m) => {
          this.onRoomChanged.next(m);
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

  public get onGraphChanged$(): Observable<WSEventGraphChanged> {
    return this.onGraphChanged.asObservable();
  }

  public get onScenarioProgress$(): Observable<WSEventScenarioProgress> {
    return this.onScenarioProgress.asObservable();
  }

  public get onSetLocks$(): Observable<WSEventSetLocks> {
    return this.onSetLocks.asObservable();
  }

  public get onRoomChanged$(): Observable<WSEventRoomChanged> {
    return this.onRoomChanged.asObservable();
  }
}
