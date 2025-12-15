import { SocketState } from "./SocketState.ts";
import { match } from "ts-pattern";

export function displayStringForState(socketState: SocketState): string {
  return match(socketState)
    .with({ type: "connected" }, () => "Connected")
    .with({ type: "connecting" }, () => "Connecting…")
    .with({ type: "connect_error" }, ({ error }) => `Error: ${error.message}`)
    .with({ type: "disconnect" }, () => "Disconnected")
    .exhaustive();
}
