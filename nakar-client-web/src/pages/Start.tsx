import { Container, Stack } from "react-bootstrap";
import { useLoaderData } from "react-router";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { RoomCard } from "../shared/cms/RoomCard.tsx";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { ProjectCard } from "../shared/cms/ProjectCard.tsx";
import { useBearStore } from "../state/useBearStore.ts";
import { startControllerGetStart, StartPageDto } from "../../src-gen";
import { CMSEmptyHint } from "../shared/cms/CMSEmptyHint.tsx";
import { useIsLoggedIn } from "../state/useIsLoggedIn.ts";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { useState } from "react";

export async function StartLoader(): Promise<StartPageDto> {
  return resultOrThrow(
    await startControllerGetStart({
      query: { recentRoomIds: useBearStore.getState().start.myRooms.join(",") },
    }),
  );
}

export function Start() {
  const loaderData: StartPageDto = useLoaderData();
  const [recentRooms, setRecentRooms] = useState(loaderData.recentRooms);
  const isLoggedIn: boolean = useIsLoggedIn();
  const removeRoom = useBearStore((s) => s.start.removeRoom);

  return (
    <Stack className={""}>
      <CMSNavbar breadcrumbContext={[{ title: "Home", url: "/" }]}></CMSNavbar>
      <div className={"overflow-auto mb-auto p-5"}>
        <Container>
          <Stack gap={5}>
            <p className={"text-muted"}>
              Enter a public room or log in and create your own projects.
            </p>

            {recentRooms.length > 0 && (
              <Stack>
                <h5>Recent Rooms</h5>
                <Stack
                  direction={"horizontal"}
                  gap={3}
                  className={"justify-content-start flex-wrap"}
                >
                  {recentRooms.map((r) => (
                    <RoomCard
                      style={{ width: "280px" }}
                      key={r.id}
                      room={r}
                      onRemove={() => {
                        removeRoom(r.id);
                        setRecentRooms((oldRecentRooms) => {
                          return oldRecentRooms.filter(
                            (oldRecentRoom) => oldRecentRoom.id !== r.id,
                          );
                        });
                      }}
                    ></RoomCard>
                  ))}
                </Stack>
              </Stack>
            )}

            <Stack>
              <h5>Public Rooms</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {loaderData.publicRooms.map((r) => (
                  <RoomCard key={r.id} room={r}></RoomCard>
                ))}
                {loaderData.publicRooms.length === 0 && (
                  <span className={"small text-muted"}>None</span>
                )}
              </Stack>
            </Stack>

            <Stack>
              <h5>My Projects</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {isLoggedIn && (
                  <CMSButton
                    link={"/project/add"}
                    title={"Create Project"}
                    icon={"plus-lg"}
                  ></CMSButton>
                )}
                {loaderData.myProjects.map((r) => (
                  <ProjectCard key={r.id} project={r}></ProjectCard>
                ))}
                <CMSEmptyHint list={loaderData.myProjects}></CMSEmptyHint>
              </Stack>
            </Stack>
            <Stack>
              <h5>Invited Projects</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {loaderData.collaborationProjects.map((r) => (
                  <ProjectCard key={r.id} project={r}></ProjectCard>
                ))}
                <CMSEmptyHint
                  list={loaderData.collaborationProjects}
                ></CMSEmptyHint>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </div>
    </Stack>
  );
}
