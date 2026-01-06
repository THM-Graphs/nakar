import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { match } from "ts-pattern";
import clsx from "clsx";
import { SocketState } from "../ws/SocketState.ts";
import { displayStringForState } from "../ws/displayStringForState.ts";
import { useBearStore } from "../../state/useBearStore.ts";

export function SocketStateDisplay() {
  const socketState = useBearStore((s) => s.room.websockets.state);

  return (
    <OverlayTrigger
      placement="left"
      delay={{ show: 500, hide: 0 }}
      overlay={<Tooltip>{displayStringForState(socketState)}</Tooltip>}
    >
      <Stack
        className={clsx(
          "justify-content-center align-items-center flex-grow-0 flex-shrink-0 ps-2 pe-2",
          colorForState(socketState),
        )}
      >
        <i
          className={clsx(
            "bi",
            iconForState(socketState),
            // forgroundColorForState(props.socketState),
          )}
        ></i>
      </Stack>
    </OverlayTrigger>
  );
}

function colorForState(socketState: SocketState): string {
  return match(socketState)
    .with({ type: "connected" }, () => "text-success-emphasis")
    .with({ type: "connecting" }, () => "text-warning-emphasis")
    .with({ type: "connect_error" }, () => "text-danger-emphasis")
    .with({ type: "disconnect" }, () => "text-danger-emphasis")
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
