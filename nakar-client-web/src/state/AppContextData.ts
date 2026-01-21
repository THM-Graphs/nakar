import { Env } from "../shared/env/env.ts";
import { WebSocketsManager } from "../shared/ws/WebSocketsManager.ts";
import { createContext, useContext } from "react";
import { useBearStore } from "./useBearStore.ts";

export const AppContext = createContext<AppContextData | null>(null);

export function useAppContext(): AppContextData {
  const context = useContext(AppContext);
  if (context == null) {
    throw new Error("Context Error");
  }
  return context;
}

export class AppContextData {
  public readonly env: Env;
  public readonly webSocketsManager: WebSocketsManager;

  constructor(env: Env) {
    this.env = env;
    this.webSocketsManager = new WebSocketsManager(env);
  }

  public logout(): void {
    useBearStore.getState().global.auth.setJWT(null);
    location.reload();
  }
}
