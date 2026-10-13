import { io, Socket as UntypedSocket } from "socket.io-client";
import { Env } from "../env/env.ts";
import { ClientToServerEvents } from "./ClientToServerEvents.ts";
import { ServerToClientEvents } from "./ServerToClientEvents.ts";
import { Observable, Subject } from "rxjs";
import { ActionWsdto, AuthWsdto, EventWsdto } from "api-client";
import { useBearStore } from "../../state/useBearStore.ts";
import { match } from "ts-pattern";

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
    useBearStore.getState().room.websockets.setState({ type: "connecting" });

    this.socket.on("connect", () => {
      /* Will have to wait for CanvasReadyWsdto to set state to connected */
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
      match(m)
        .with({ event: { type: "CanvasReadyWsdto" } }, () => {
          useBearStore
            .getState()
            .room.websockets.setState({ type: "connected" });
        })
        .otherwise((event: EventWsdto) => {
          this.onMessage.next(event);
        });
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
