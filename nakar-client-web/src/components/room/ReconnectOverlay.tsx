import { AppNavbar } from "../shared/AppNavbar.tsx";
import { BackButton } from "../shared/BackButton.tsx";
import { SocketStateDisplay } from "./SocketStateDisplay.tsx";
import { Stack } from "react-bootstrap";
import { displayStringForState } from "../../lib/ws/displayStringForState.ts";
import { Loading } from "../shared/Loading.tsx";
import { NavbarLogo } from "../shared/NavbarLogo.tsx";
import { useBearStore } from "../../lib/state/useBearStore.ts";

export function ReconnectOverlay() {
  const socketState = useBearStore((s) => s.room.websockets.state);

  return (
    <Stack
      className={"position-absolute bg-body-secondary"}
      gap={2}
      style={{ width: "100%", height: "100%", zIndex: 500 }}
    >
      <AppNavbar
        left={<BackButton href={"/"}></BackButton>}
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
