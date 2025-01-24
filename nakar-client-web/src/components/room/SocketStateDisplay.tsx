import { Badge, OverlayTrigger, Tooltip } from "react-bootstrap";
import { match } from "ts-pattern";
import clsx from "clsx";
import { SocketState } from "../../lib/ws/SocketState.ts";

export function SocketStateDisplay(props: { socketState: SocketState }) {
  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 0, hide: 0 }}
      overlay={<Tooltip>{displayStringForState(props.socketState)}</Tooltip>}
    >
      <Badge
        bg="secondary"
        className={clsx(backgroundColorForState(props.socketState))}
      >
        <i
          className={clsx(
            "bi",
            iconForState(props.socketState),
            // forgroundColorForState(props.socketState),
          )}
        ></i>
      </Badge>
    </OverlayTrigger>
  );
}

function backgroundColorForState(socketState: SocketState): string {
  return match(socketState)
    .with({ type: "connected" }, () => "bg-success")
    .with({ type: "connecting" }, () => "bg-warning")
    .with({ type: "connect_error" }, () => "bg-danger")
    .with({ type: "disconnect" }, () => "bg-danger")
    .exhaustive();
}

function iconForState(socketState: SocketState): string {
  return match(socketState)
    .with({ type: "connected" }, () => "bi-wifi")
    .with({ type: "connecting" }, () => "bi-wifi-off")
    .with({ type: "connect_error" }, () => "bi-wifi-off")
    .with({ type: "disconnect" }, () => "bi-wifi-off")
    .exhaustive();
}

function displayStringForState(socketState: SocketState): string {
  return match(socketState)
    .with({ type: "connected" }, () => "Connected")
    .with({ type: "connecting" }, () => "Connecting...")
    .with({ type: "connect_error" }, ({ error }) => `Error: ${error.message}`)
    .with({ type: "disconnect" }, () => "Disconnected")
    .exhaustive();
}
