import { AppNavbar } from "../bars/AppNavbar.tsx";
import { SocketStateDisplay } from "./SocketStateDisplay.tsx";
import { Stack } from "react-bootstrap";
import { displayStringForState } from "../ws/displayStringForState.ts";
import { Loading } from "../elements/Loading.tsx";
import { NavbarLogo } from "../bars/NavbarLogo.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { ActionNavbarButton } from "../../room/actions/ActionNavbarButton.tsx";
import { CloseRoomAction } from "../../room/actions/CloseRoomAction.ts";
import { useNavigate } from "react-router";

export function ReconnectOverlay() {
  const socketState = useBearStore((s) => s.room.websockets.state);
  const navigate = useNavigate();

  return (
    <Stack
      className={"position-absolute bg-body-secondary"}
      gap={2}
      style={{ width: "100%", height: "100%", zIndex: 500 }}
    >
      <AppNavbar
        left={
          <ActionNavbarButton
            action={CloseRoomAction.shared}
            params={{ navigate }}
            customTitle={"Rooms"}
          ></ActionNavbarButton>
        }
        center={<NavbarLogo></NavbarLogo>}
        right={<SocketStateDisplay></SocketStateDisplay>}
      ></AppNavbar>
      <div className={"flex-grow-1"}></div>
      <Stack className={"align-items-center flex-grow-0"} gap={5}>
        <span className={"text-muted small font-monospace"}>
          {displayStringForState(socketState)}
        </span>
        <Stack
          direction={"horizontal"}
          gap={2}
          className={"align-self-center text-muted"}
        >
          <Loading size={"sm"}></Loading>
          <span>Reconnecting…</span>
        </Stack>
      </Stack>
      <div className={"flex-grow-1"}></div>
    </Stack>
  );
}
