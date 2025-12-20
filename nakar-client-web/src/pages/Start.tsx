import { Container, Stack } from "react-bootstrap";
import { useLoaderData } from "react-router";
import {
  getProjects,
  getRoom,
  getRooms,
  Projects,
  Room as RoomSchema,
  Rooms,
} from "../../src-gen";
import { AppContext } from "../state/AppContext.ts";
import { useBearStore } from "../state/useBearStore.ts";
import { match, P } from "ts-pattern";
import { loadableFromResult } from "../shared/data/loadableFromResult.ts";
import { Loadable } from "../shared/data/Loadable.ts";
import { CMSNavbar } from "../cms/CMSNavbar.tsx";
import { CMSFooter } from "../cms/CMSFooter.tsx";
import { RoomCard } from "../cms/RoomCard.tsx";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { ProjectCard } from "../cms/ProjectCard.tsx";

type StartPageLoaderData = {
  recentRooms: RoomSchema[];
  rooms: Rooms;
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
  const rooms: Rooms = resultOrThrow(await getRooms());
  const projects: Loadable<Projects> = loadableFromResult(await getProjects());
  return {
    recentRooms: recentRooms,
    rooms: rooms,
    projects: projects,
  };
}

export function Start(props: { context: AppContext }) {
  const loaderData: StartPageLoaderData = useLoaderData();

  return (
    <Stack
      style={{ height: "100%", width: "100%" }}
      className={"justify-content-start bg-body-tertiary"}
    >
      <CMSNavbar context={props.context} backUrl={null}></CMSNavbar>
      <div className={"overflow-auto mb-auto p-5"}>
        <Container>
          <Stack gap={5}>
            <p className={"text-muted"}>
              Enter a public room or log in and create your own projects.
            </p>

            {loaderData.recentRooms.length > 0 && (
              <Stack>
                <h5>Recent Rooms</h5>
                <Stack direction={"horizontal"} gap={3} className={"flex-wrap"}>
                  {loaderData.recentRooms.map((r) => (
                    <RoomCard
                      width={300}
                      key={r.id}
                      room={r}
                      showProjectTitle={true}
                    ></RoomCard>
                  ))}
                </Stack>
              </Stack>
            )}

            <Stack>
              <h5>Public Rooms</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {loaderData.rooms.rooms.map((r) => (
                  <RoomCard
                    key={r.id}
                    room={r}
                    showProjectTitle={true}
                  ></RoomCard>
                ))}
                {loaderData.rooms.rooms.length === 0 && (
                  <span className={"small text-muted"}>None</span>
                )}
              </Stack>
            </Stack>

            {loaderData.projects.type == "data" && (
              <>
                <Stack>
                  <h5>My Projects</h5>
                  <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                    {loaderData.projects.data.myProjects.map((r) => (
                      <ProjectCard key={r.id} project={r}></ProjectCard>
                    ))}
                    {loaderData.projects.data.myProjects.length === 0 && (
                      <span className={"small text-muted"}>None</span>
                    )}
                  </Stack>
                </Stack>
                <Stack>
                  <h5>Invited Projects</h5>
                  <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                    {loaderData.projects.data.collaborationProjects.map((r) => (
                      <ProjectCard key={r.id} project={r}></ProjectCard>
                    ))}
                    {loaderData.projects.data.collaborationProjects.length ===
                      0 && <span className={"small text-muted"}>None</span>}
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        </Container>
      </div>
      <CMSFooter></CMSFooter>
    </Stack>
  );
}
