import { SocketState } from "./SocketState.ts";
import { useContext, useEffect, useState } from "react";
import { WebSocketsManagerContext } from "./WebSocketsManagerContext.ts";

export function useWebSocketsState(): SocketState {
  const manager = useContext(WebSocketsManagerContext);
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
