import { WebSocketsManager } from "./WebSocketsManager.ts";
import { createContext } from "react";

export const WebSocketsManagerContext = createContext(new WebSocketsManager());
