import { SocketState } from "./SocketState.ts";
import { useEffect, useState } from "react";
import { WebSocketsManager } from "./WebSocketsManager.ts";

export function useWebSocketsState(manager: WebSocketsManager): SocketState {
  const [current, setCurrent] = useState<SocketState>(manager.socketState);

  useEffect(() => {
    const s = manager.onSocketStateChanged$.subscribe((newState) => {
      setCurrent(newState);
    });
    return () => {
      s.unsubscribe();
    };
  }, []);

  return current;
}
