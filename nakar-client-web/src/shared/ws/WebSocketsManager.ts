import { io, Socket as UntypedSocket } from "socket.io-client";
import { Env } from "../env/env.ts";
import { ClientToServerEvents } from "./ClientToServerEvents.ts";
import { ServerToClientEvents } from "./ServerToClientEvents.ts";
import { Observable, Subject } from "rxjs";
import { ActionWsdto, AuthWsdto, EventWsdto } from "api-client";
import { useBearStore } from "../../state/useBearStore.ts";

export type Socket = UntypedSocket<ServerToClientEvents, ClientToServerEvents>;

export class WebSocketsManager {
  private readonly _env: Env;
  private socket: Socket | null;
  private readonly onMessage: Subject<EventWsdto>;

  public constructor(env: Env) {
    this._env = env;
    this.socket = null;
    this.onMessage = new Subject();
  }

  public connect(canvasId: string): void {
    this.socket = io(this._env.BACKEND_SOCKET_URL, {
      auth: {
        jwt: useBearStore.getState().global.auth.jwt ?? "",
        canvasId: canvasId,
      } satisfies AuthWsdto,
    });

    this.socket.on("connect", () => {
      useBearStore.getState().room.websockets.setState({ type: "connected" });
    });
    this.socket.on("connect_error", (error: Error) => {
      useBearStore
        .getState()
        .room.websockets.setState({ type: "connect_error", error: error });
    });
    this.socket.on("disconnect", () => {
      useBearStore.getState().room.websockets.setState({ type: "disconnect" });
    });
    this.socket.on("message", (m) => {
      this.onMessage.next(m);
    });
  }

  public disconnect(): void {
    if (this.socket == null) {
      return;
    }
    this.socket.disconnect();
    this.socket = null;
  }

  public sendMessage(message: ActionWsdto["action"]): void {
    if (this.socket == null) {
      return;
    }
    this.socket.emit("message", { action: message } satisfies ActionWsdto);
  }

  public get onMessage$(): Observable<EventWsdto> {
    return this.onMessage.asObservable();
  }
}
