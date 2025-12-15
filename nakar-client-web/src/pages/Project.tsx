import { CMSNavbar } from "../cms/CMSNavbar.tsx";
import { AppContext } from "../state/AppContext.ts";
import { Container, Stack } from "react-bootstrap";
import { CMSFooter } from "../cms/CMSFooter.tsx";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { getProject, Project as SchemaProject } from "../../src-gen";
import { UserCard } from "../cms/UserCard.tsx";
import { RoomCard } from "../cms/RoomCard.tsx";
import { DatabaseConnectionCard } from "../cms/DatabaseConnectionCard.tsx";
import { ScenarioGroupCard } from "../cms/ScenarioGroupCard.tsx";

export interface ProjectContext {
  project: SchemaProject;
}

export async function ProjectLoader(
  args: LoaderFunctionArgs,
): Promise<ProjectContext> {
  const id: string | undefined = args.params["id"];

  if (id == null) {
    throw new Error("No room id provided.");
  }

  const project: SchemaProject = resultOrThrow(
    await getProject({ path: { id: id } }),
  );

  return {
    project: project,
  };
}

export function Project(props: { context: AppContext }) {
  const projectContext: ProjectContext = useLoaderData();
  return (
    <Stack className={"justify-content-between h-100 bg-body-secondary"}>
      <CMSNavbar context={props.context} backUrl={".."}></CMSNavbar>
      <div className={"flex-grow-1 overflow-y-scroll"}>
        <Container className={"pb-5 pt-5"}>
          <Stack gap={5}>
            <h1 className={"user-select-text"}>
              {projectContext.project.title}
            </h1>
            <Stack>
              <h5>Project Users</h5>
              <Stack direction={"horizontal"} gap={3} className={"flex-wrap"}>
                {projectContext.project.owner?.current != null && (
                  <UserCard
                    user={projectContext.project.owner.current}
                    role={"owner"}
                  ></UserCard>
                )}
                {projectContext.project.collaborators.map((c) => (
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
                {projectContext.project.rooms.map((r) => (
                  <RoomCard key={r.id} room={r}></RoomCard>
                ))}
              </Stack>
            </Stack>
            <Stack>
              <h5>Database Connections</h5>
              <Stack direction={"horizontal"} gap={3} className={"flex-wrap"}>
                {projectContext.project.databases.map((r) => (
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
                {projectContext.project.scenarioGroups.map((r) => (
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
