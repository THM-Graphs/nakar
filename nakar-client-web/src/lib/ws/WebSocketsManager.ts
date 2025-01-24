import { io, Socket as UntypedSocket } from "socket.io-client";
import { env } from "../env/env.ts";
import { ClientToServerEvents } from "./ClientToServerEvents.ts";
import { ServerToClientEvents } from "./ServerToClientEvents.ts";
import {
  WSClientToServerMessage,
  WSEventError,
  WSEventNodesMoved,
  WSEventScenarioDataChanged,
  WSEventUserJoined,
  WSEventUserLeft,
  WSServerToClientMessage,
} from "../../../src-gen";
import { BehaviorSubject, distinct, Observable, Subject } from "rxjs";
import { SocketState } from "./SocketState.ts";
import { match } from "ts-pattern";

export type Socket = UntypedSocket<ServerToClientEvents, ClientToServerEvents>;

export class WebSocketsManager {
  private readonly socket: Socket;
  private readonly _socketState: BehaviorSubject<SocketState>;

  private readonly onError: Subject<WSEventError>;
  private readonly onNodesMoved: Subject<WSEventNodesMoved>;
  private readonly onScenarioDataChanged: Subject<WSEventScenarioDataChanged>;
  private readonly onUserJoinded: Subject<WSEventUserJoined>;
  private readonly onUserLeft: Subject<WSEventUserLeft>;

  public constructor() {
    this.socket = io(env().BACKEND_SOCKET_URL, {});
    this._socketState = new BehaviorSubject<SocketState>({
      type: "connecting",
    });

    this.onError = new Subject();
    this.onNodesMoved = new Subject();
    this.onScenarioDataChanged = new Subject();
    this.onUserJoinded = new Subject();
    this.onUserLeft = new Subject();

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
        .with({ type: "WSEventError" }, (m) => {
          this.onError.next(m);
        })
        .with({ type: "WSEventNodesMoved" }, (m) => {
          this.onNodesMoved.next(m);
        })
        .with({ type: "WSEventScenarioDataChanged" }, (m) => {
          this.onScenarioDataChanged.next(m);
        })
        .with({ type: "WSEventUserJoined" }, (m) => {
          this.onUserJoinded.next(m);
        })
        .with({ type: "WSEventUserLeft" }, (m) => {
          this.onUserLeft.next(m);
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
    return this._socketState
      .asObservable()
      .pipe(distinct((state) => state.type));
  }

  public get onError$(): Observable<WSEventError> {
    return this.onError.asObservable();
  }

  public get onNodesMoved$(): Observable<WSEventNodesMoved> {
    return this.onNodesMoved.asObservable();
  }

  public get onScenarioDataChanged$(): Observable<WSEventScenarioDataChanged> {
    return this.onScenarioDataChanged.asObservable();
  }

  public get onUserJoined$(): Observable<WSEventUserJoined> {
    return this.onUserJoinded.asObservable();
  }

  public get onUserLeft$(): Observable<WSEventUserLeft> {
    return this.onUserLeft.asObservable();
  }
}
