export type SocketState =
  | { type: "connecting" }
  | { type: "connected" }
  | { type: "connect_error"; error: Error }
  | { type: "disconnect" };
