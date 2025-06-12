import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Stack } from "react-bootstrap";
import { RoomList } from "../components/start/RoomList.tsx";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { getRooms, Rooms as RoomsSchema } from "../../src-gen";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { NavbarLogo } from "../components/shared/NavbarLogo.tsx";
import { AppContext } from "../lib/state/AppContext.ts";

export async function StartLoader(): Promise<RoomsSchema> {
  const rooms = await getRooms();
  return resultOrThrow(rooms);
}

export function Start(props: { context: AppContext }) {
  const loaderData: RoomsSchema = useLoaderData();

  return (
    <Stack style={{ height: "100%" }}>
      <AppNavbar
        center={<NavbarLogo></NavbarLogo>}
        right={<InfoDropdown context={props.context}></InfoDropdown>}
      ></AppNavbar>
      <RoomList rooms={loaderData}></RoomList>
    </Stack>
  );
}
