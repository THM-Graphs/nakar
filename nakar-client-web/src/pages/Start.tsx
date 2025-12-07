import { AppNavbar } from "../shared/bars/AppNavbar.tsx";
import { Container, Stack } from "react-bootstrap";
import { RoomList } from "../start/RoomList.tsx";
import { InfoDropdown } from "../shared/bars/InfoDropdown.tsx";
import { useLoaderData, useNavigate } from "react-router";
import {
  getRoom,
  getRooms,
  getRoomTemplates,
  Room as RoomSchema,
  Rooms,
  RoomTemplates,
} from "../../src-gen";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { NavbarLogo } from "../shared/bars/NavbarLogo.tsx";
import { AppContext } from "../state/AppContext.ts";
import { StatusBar } from "../shared/bars/StatusBar.tsx";
import { SocketStateDisplay } from "../shared/socket/SocketStateDisplay.tsx";
import { AuthButton } from "../shared/auth/AuthButton.tsx";
import { useBearStore } from "../state/useBearStore.ts";
import { RoomTemplateList } from "../start/RoomTemplateList.tsx";
import { match, P } from "ts-pattern";
import { loadableFromResult } from "../data/loadableFromResult.ts";
import { Loadable } from "../data/Loadable.ts";

type StartPageLoaderData = {
  recentRooms: RoomSchema[];
  templates: RoomTemplates;
  rooms: Loadable<Rooms>;
};

export async function StartLoader(): Promise<StartPageLoaderData> {
  const myRooms = useBearStore.getState().start.myRooms;
  const recentRooms: RoomSchema[] = [];
  for (const roomId of myRooms) {
    const result = await getRoom({ path: { id: roomId } });
    match(result)
      .with({ data: P.nonNullable }, (r) => {
        recentRooms.push(r.data);
      })
      .otherwise((error) => {
        if (error.response.status === 404) {
          useBearStore.getState().start.removeRoom(roomId);
        }
      });
  }
  const templates: RoomTemplates = resultOrThrow(await getRoomTemplates());
  const rooms: Loadable<Rooms> = loadableFromResult(await getRooms());
  return {
    recentRooms: recentRooms,
    templates: templates,
    rooms: rooms,
  };
}

export function Start(props: { context: AppContext }) {
  const loaderData: StartPageLoaderData = useLoaderData();
  const removeMyRoom = useBearStore((s) => s.start.removeRoom);
  const navigate = useNavigate();

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
              title={"Recent Rooms"}
              rooms={loaderData.recentRooms}
              context={props.context}
              style={{ maxWidth: "500px" }}
              onDelete={async (room: RoomSchema) => {
                if (
                  confirm(
                    "Remove room from recents list? You will only be able to access the room using its link.",
                  )
                ) {
                  removeMyRoom(room.id);
                  await navigate(".");
                }
              }}
            ></RoomList>
            <RoomTemplateList
              roomTemplates={loaderData.templates}
              context={props.context}
              style={{ maxWidth: "400px" }}
            ></RoomTemplateList>
            {loaderData.rooms.type === "data" && (
              <RoomList
                rooms={loaderData.rooms.data.rooms}
                context={props.context}
              ></RoomList>
            )}
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
