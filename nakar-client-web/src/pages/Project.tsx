import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { Container, Stack } from "react-bootstrap";
import { CMSFooter } from "../shared/cms/CMSFooter.tsx";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { UserCard } from "../shared/cms/UserCard.tsx";
import { RoomCard } from "../shared/cms/RoomCard.tsx";
import { DatabaseConnectionCard } from "../shared/cms/DatabaseConnectionCard.tsx";
import { ScenarioGroupCard } from "../shared/cms/ScenarioGroupCard.tsx";
import { projectControllerGetProject, ProjectPageDto } from "../../src-gen";
import { CMSEmptyHint } from "../shared/cms/CMSEmptyHint.tsx";
import { CMSButton } from "../shared/cms/CMSButton.tsx";

export async function ProjectLoader(
  args: LoaderFunctionArgs,
): Promise<ProjectPageDto> {
  const id: string | undefined = args.params["id"];

  if (id == null) {
    throw new Error("No room id provided.");
  }

  const project: ProjectPageDto = resultOrThrow(
    await projectControllerGetProject({ path: { projectId: id } }),
  );

  return project;
}

export function Project() {
  const projectContext: ProjectPageDto = useLoaderData();
  const navigate = useNavigate();

  return (
    <Stack className={"justify-content-between h-100 bg-body-tertiary"}>
      <CMSNavbar backUrl={".."}></CMSNavbar>
      <div className={"flex-grow-1 overflow-y-scroll"}>
        <Container className={"pb-5 pt-5"}>
          <Stack gap={5}>
            <h1 className={"user-select-text"}>{projectContext.title}</h1>
            <CMSButton
              title={"Edit Project"}
              icon={"pen"}
              onClick={async () => {
                await navigate(`/project/${projectContext.id}/edit`);
              }}
            ></CMSButton>
            <Stack>
              <h5>Project Users</h5>
              <Stack direction={"horizontal"} gap={3} className={"flex-wrap"}>
                {projectContext.owner != null && (
                  <UserCard
                    user={projectContext.owner}
                    role={"owner"}
                  ></UserCard>
                )}
                {projectContext.collaborators.map((c) => (
                  <UserCard
                    key={c.id}
                    user={c}
                    role={"collaborator"}
                  ></UserCard>
                ))}
              </Stack>
            </Stack>
            <Stack>
              <h5>Rooms</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {projectContext.rooms.map((r) => (
                  <RoomCard key={r.id} room={r}></RoomCard>
                ))}
                <CMSEmptyHint list={projectContext.rooms}></CMSEmptyHint>
              </Stack>
            </Stack>
            <Stack>
              <h5>Database Connections</h5>
              <Stack direction={"horizontal"} gap={3} className={"flex-wrap"}>
                {projectContext.databases.map((r) => (
                  <DatabaseConnectionCard
                    key={r.id}
                    databaseConnection={r}
                  ></DatabaseConnectionCard>
                ))}
                <CMSEmptyHint list={projectContext.databases}></CMSEmptyHint>
              </Stack>
            </Stack>
            <Stack>
              <h5>Scenarios</h5>
              <Stack direction={"vertical"} gap={3} className={"flex-wrap"}>
                {projectContext.scenarioGroups.map((r) => (
                  <ScenarioGroupCard
                    key={r.id}
                    scenarioGroup={r}
                  ></ScenarioGroupCard>
                ))}
                <CMSEmptyHint
                  list={projectContext.scenarioGroups}
                ></CMSEmptyHint>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </div>
      <CMSFooter></CMSFooter>
    </Stack>
  );
}
