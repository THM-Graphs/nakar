import { Env } from "../shared/env/env.ts";
import { WebSocketsManager } from "../shared/ws/WebSocketsManager.ts";

export class AppContext {
  public readonly env: Env;
  public readonly webSocketsManager: WebSocketsManager;

  constructor(env: Env) {
    this.env = env;
    this.webSocketsManager = new WebSocketsManager(env);
  }
}
