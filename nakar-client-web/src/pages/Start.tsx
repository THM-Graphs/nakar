import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Alert, Container, Stack } from "react-bootstrap";
import { RoomList } from "../components/start/RoomList.tsx";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";
import { useLoaderData, useNavigate } from "react-router";
import {
  getRoom,
  getRooms,
  getRoomTemplates,
  Room as RoomSchema,
  Rooms as RoomsSchema,
  RoomTemplates,
} from "../../src-gen";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { NavbarLogo } from "../components/shared/NavbarLogo.tsx";
import { AppContext } from "../lib/state/AppContext.ts";
import { StatusBar } from "../components/shared/StatusBar.tsx";
import { SocketStateDisplay } from "../components/room/SocketStateDisplay.tsx";
import { AuthButton } from "../components/shared/auth/AuthButton.tsx";
import { useBearStore } from "../lib/state/useBearStore.ts";
import { RoomTemplateList } from "../components/start/RoomTemplateList.tsx";
import { match, P } from "ts-pattern";

type StartPageLoaderData = {
  rooms: RoomSchema[];
  templates: RoomTemplates;
};

export async function StartLoader(): Promise<StartPageLoaderData> {
  const myRooms = useBearStore.getState().start.myRooms;
  const rooms: RoomSchema[] = [];
  for (const roomId of myRooms) {
    const result = await getRoom({ path: { id: roomId } });
    match(result)
      .with({ data: P.nonNullable }, (r) => {
        rooms.push(r.data);
      })
      .otherwise((error) => {
        if (error.response.status === 404) {
          useBearStore.getState().start.removeRoom(roomId);
        }
      });
  }
  const templates: RoomTemplates = resultOrThrow(await getRoomTemplates());
  return {
    rooms: rooms,
    templates: templates,
  };
}

export function Start(props: { context: AppContext }) {
  const loaderData: StartPageLoaderData = useLoaderData();

  return (
    <Stack
      style={{ height: "100%", width: "100%" }}
      className={"justify-content-start"}
    >
      <AppNavbar
        center={<NavbarLogo></NavbarLogo>}
        right={<InfoDropdown context={props.context}></InfoDropdown>}
      ></AppNavbar>
      <div className={"overflow-auto mb-auto p-5"}>
        <Container>
          <p className={"text-muted mb-5"}>
            Enter a room or create one using the given templates.
          </p>
          <Stack direction={"horizontal"} className={"flex-wrap"} gap={5}>
            <RoomList
              rooms={loaderData.rooms}
              context={props.context}
              style={{ maxWidth: "500px" }}
            ></RoomList>
            <RoomTemplateList
              roomTemplates={loaderData.templates}
              context={props.context}
              style={{ maxWidth: "400px" }}
            ></RoomTemplateList>
          </Stack>
        </Container>
      </div>
      <StatusBar
        right={
          <Stack direction={"horizontal"}>
            <AuthButton></AuthButton>
            <SocketStateDisplay></SocketStateDisplay>
          </Stack>
        }
      ></StatusBar>
    </Stack>
  );
}
