import { Env } from "../env/env.ts";
import { WebSocketsManager } from "../ws/WebSocketsManager.ts";
import { useBearStore } from "./useBearStore.ts";

export class AppContext {
  public readonly env: Env;
  public readonly webSocketsManager: WebSocketsManager;

  constructor(env: Env) {
    this.env = env;
    this.webSocketsManager = new WebSocketsManager(env);
    this.webSocketsManager.onSocketStateChanged$.subscribe((newState) => {
      useBearStore.getState().room.websockets.setState(newState);
    });
  }
}
