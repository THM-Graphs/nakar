import { Env } from "../env/env.ts";
import { WebSocketsManager } from "../ws/WebSocketsManager.ts";
import { useBearStore } from "./useBearStore.ts";
import { D3Renderer } from "../d3/D3Renderer.ts";

export class AppContext {
  public readonly env: Env;
  public readonly webSocketsManager: WebSocketsManager;
  public readonly renderer: D3Renderer;

  constructor(env: Env) {
    this.env = env;
    this.webSocketsManager = new WebSocketsManager(env);
    this.renderer = new D3Renderer();
    this.webSocketsManager.onSocketStateChanged$.subscribe((newState) => {
      useBearStore.getState().room.websockets.setState(newState);
    });
  }
}
