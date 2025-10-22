import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { match } from "ts-pattern";
import clsx from "clsx";
import { SocketState } from "../../ws/SocketState.ts";
import { displayStringForState } from "../../ws/displayStringForState.ts";
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
          "text-white justify-content-center align-items-center flex-grow-0 flex-shrink-0",
          backgroundColorForState(socketState),
        )}
        style={{
          width: "40px",
        }}
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
