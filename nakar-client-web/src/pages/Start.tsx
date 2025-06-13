import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Container, Stack } from "react-bootstrap";
import { RoomList } from "../components/start/RoomList.tsx";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";
import { useLoaderData } from "react-router";
import { getRooms, Rooms as RoomsSchema } from "../../src-gen";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { NavbarLogo } from "../components/shared/NavbarLogo.tsx";
import { AppContext } from "../lib/state/AppContext.ts";
import { StatusBar } from "../components/shared/StatusBar.tsx";
import { SocketStateDisplay } from "../components/room/SocketStateDisplay.tsx";

export async function StartLoader(): Promise<RoomsSchema> {
  const rooms = await getRooms();
  return resultOrThrow(rooms);
}

export function Start(props: { context: AppContext }) {
  const loaderData: RoomsSchema = useLoaderData();

  return (
    <Stack
      style={{ height: "100%", width: "100%" }}
      className={"justify-content-start"}
    >
      <AppNavbar
        center={<NavbarLogo></NavbarLogo>}
        right={<InfoDropdown context={props.context}></InfoDropdown>}
      ></AppNavbar>
      <div className={"overflow-auto mb-auto"}>
        <Container style={{ maxWidth: "450px" }}>
          <RoomList rooms={loaderData} context={props.context}></RoomList>
        </Container>
      </div>
      <StatusBar right={<SocketStateDisplay></SocketStateDisplay>}></StatusBar>
    </Stack>
  );
}
