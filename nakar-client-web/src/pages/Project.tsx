import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { AppContext } from "../state/AppContext.ts";
import { Container, Stack } from "react-bootstrap";
import { CMSFooter } from "../shared/cms/CMSFooter.tsx";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { ProjectPage as SchemaProjectPage } from "../../src-gen";
import { UserCard } from "../shared/cms/UserCard.tsx";
import { RoomCard } from "../shared/cms/RoomCard.tsx";
import { DatabaseConnectionCard } from "../shared/cms/DatabaseConnectionCard.tsx";
import { ScenarioGroupCard } from "../shared/cms/ScenarioGroupCard.tsx";
import {
  projectPageControllerGetProjectPage,
  ProjectPageDto,
} from "../../src-gen-2";

export async function ProjectLoader(
  args: LoaderFunctionArgs,
): Promise<ProjectPageDto> {
  const id: string | undefined = args.params["id"];

  if (id == null) {
    throw new Error("No room id provided.");
  }

  const project: ProjectPageDto = resultOrThrow(
    await projectPageControllerGetProjectPage({ path: { id: id } }),
  );

  return project;
}

export function Project(props: { context: AppContext }) {
  const projectContext: ProjectPageDto = useLoaderData();
  return (
    <Stack className={"justify-content-between h-100 bg-body-tertiary"}>
      <CMSNavbar context={props.context} backUrl={".."}></CMSNavbar>
      <div className={"flex-grow-1 overflow-y-scroll"}>
        <Container className={"pb-5 pt-5"}>
          <Stack gap={5}>
            <h1 className={"user-select-text"}>{projectContext.title}</h1>
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
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </div>
      <CMSFooter></CMSFooter>
    </Stack>
  );
}
