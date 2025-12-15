import { Container, Stack } from "react-bootstrap";
import { RoomList } from "../start/RoomList.tsx";
import { useLoaderData, useNavigate } from "react-router";
import {
  getRoom,
  getRooms,
  getRoomTemplates,
  Room as RoomSchema,
  Rooms,
  RoomTemplates,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { AppContext } from "../state/AppContext.ts";
import { useBearStore } from "../state/useBearStore.ts";
import { RoomTemplateList } from "../start/RoomTemplateList.tsx";
import { match, P } from "ts-pattern";
import { loadableFromResult } from "../shared/data/loadableFromResult.ts";
import { Loadable } from "../shared/data/Loadable.ts";
import { CMSNavbar } from "../cms/CMSNavbar.tsx";
import { CMSFooter } from "../cms/CMSFooter.tsx";

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
      <CMSNavbar context={props.context}></CMSNavbar>
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
      <CMSFooter></CMSFooter>
    </Stack>
  );
}
