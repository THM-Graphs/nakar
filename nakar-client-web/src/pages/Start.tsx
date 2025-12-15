import { Container, Stack } from "react-bootstrap";
import { RoomList } from "../start/RoomList.tsx";
import { useLoaderData, useNavigate } from "react-router";
import {
  getProjects,
  getRoom,
  getRooms,
  getRoomTemplates,
  Projects,
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
import { ProjectList } from "../start/ProjectList.tsx";

type StartPageLoaderData = {
  recentRooms: RoomSchema[];
  templates: RoomTemplates;
  rooms: Loadable<Rooms>;
  projects: Loadable<Projects>;
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
  const projects: Loadable<Projects> = loadableFromResult(await getProjects());
  return {
    recentRooms: recentRooms,
    templates: templates,
    rooms: rooms,
    projects: projects,
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
      <CMSNavbar context={props.context} backUrl={null}></CMSNavbar>
      <div className={"overflow-auto mb-auto p-5"}>
        <Container>
          <p className={"text-muted mb-5"}>
            Enter a room or create one using the given templates.
          </p>
          <Stack
            direction={"horizontal"}
            className={"flex-wrap align-items-top"}
            gap={5}
          >
            <RoomList
              title={"Recent Rooms"}
              rooms={loaderData.recentRooms}
              context={props.context}
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
            ></RoomTemplateList>
            {loaderData.projects.type == "data" && (
              <>
                <ProjectList
                  rooms={loaderData.projects.data.myProjects}
                  context={props.context}
                  title={"My Projects"}
                ></ProjectList>
                <ProjectList
                  rooms={loaderData.projects.data.collaborationProjects}
                  context={props.context}
                  title={"Collaboration Projects"}
                ></ProjectList>
              </>
            )}

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
