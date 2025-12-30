import { Container, Stack } from "react-bootstrap";
import { useLoaderData } from "react-router";
import { getStartPage, StartPage as StartPageData } from "../../src-gen";
import { AppContext } from "../state/AppContext.ts";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { CMSFooter } from "../shared/cms/CMSFooter.tsx";
import { RoomCard } from "../shared/cms/RoomCard.tsx";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { ProjectCard } from "../shared/cms/ProjectCard.tsx";
import { useBearStore } from "../state/useBearStore.ts";

export async function StartLoader(): Promise<StartPageData> {
  return resultOrThrow(
    await getStartPage({
      query: { recentRoomIds: useBearStore.getState().start.myRooms },
    }),
  );
}

export function Start(props: { context: AppContext }) {
  const loaderData: StartPageData = useLoaderData();

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
                {loaderData.publicRooms.map((r) => (
                  <RoomCard
                    key={r.id}
                    room={r}
                    showProjectTitle={true}
                  ></RoomCard>
                ))}
                {loaderData.publicRooms.length === 0 && (
                  <span className={"small text-muted"}>None</span>
                )}
              </Stack>
            </Stack>

            <Stack>
              <h5>My Projects</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {loaderData.myProjects.map((r) => (
                  <ProjectCard key={r.id} project={r}></ProjectCard>
                ))}
                {loaderData.myProjects.length === 0 && (
                  <span className={"small text-muted"}>None</span>
                )}
              </Stack>
            </Stack>
            <Stack>
              <h5>Invited Projects</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {loaderData.collaborationProjects.map((r) => (
                  <ProjectCard key={r.id} project={r}></ProjectCard>
                ))}
                {loaderData.collaborationProjects.length === 0 && (
                  <span className={"small text-muted"}>None</span>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </div>
      <CMSFooter></CMSFooter>
    </Stack>
  );
}
