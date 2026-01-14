import { io, Socket as UntypedSocket } from "socket.io-client";
import { Env } from "../env/env.ts";
import { ClientToServerEvents } from "./ClientToServerEvents.ts";
import { ServerToClientEvents } from "./ServerToClientEvents.ts";
import { Observable, Subject } from "rxjs";
import { ActionWsdto, EventWsdto } from "../../../src-gen";
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
    this.socket = io(this._env.BACKEND_SOCKET_URL);
    console.log(`Did connect WS to ${this._env.BACKEND_SOCKET_URL}`);

    this.socket.on("connect", () => {
      useBearStore.getState().room.websockets.setState({ type: "connected" });
      this.sendMessage({
        type: "JoinCanvasWsdto",
        canvasId: canvasId,
      });
    });
    this.socket.on("connect_error", (error: Error) => {
      useBearStore
        .getState()
        .room.websockets.setState({ type: "connect_error", error: error });
    });
    this.socket.on("disconnect", () => {
      useBearStore.getState().room.websockets.setState({ type: "disconnect" });
      setTimeout(() => {
        this.socket?.connect();
      }, 1000);
    });
    this.socket.on("message", (m) => {
      this.onMessage.next(m);
    });
  }

  public disconnect(): void {
    if (this.socket == null) {
      console.error("Socket not connected. Cannot send message");
      return;
    }
    this.sendMessage({
      type: "LeaveCanvasWsdto",
    });
    this.socket.disconnect();
    this.socket = null;
    console.log("Did destroy websockets manager");
  }

  public sendMessage(message: ActionWsdto["action"]): void {
    if (this.socket == null) {
      console.error("Socket not connected. Cannot send message");
      return;
    }
    this.socket.emit("message", { action: message } satisfies ActionWsdto);
  }

  public get onMessage$(): Observable<EventWsdto> {
    return this.onMessage.asObservable();
  }
}
