import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { Card, Container, Stack } from "react-bootstrap";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { UserCard } from "../shared/cms/UserCard.tsx";
import { RoomCard } from "../shared/cms/RoomCard.tsx";
import { DatabaseConnectionCard } from "../shared/cms/DatabaseConnectionCard.tsx";
import { ScenarioGroupCard } from "../shared/cms/ScenarioGroupCard.tsx";
import {
  databaseConnectionControllerCreateDatabaseConnection,
  projectControllerGetProject,
  ProjectPageDto,
  roomControllerCreateRoom,
  scenarioGroupControllerCreateScenarioGroup,
} from "../../src-gen";
import { CMSEmptyHint } from "../shared/cms/CMSEmptyHint.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { Router } from "../routing/Router.ts";
import { NavbarButton } from "../shared/elements/NavbarButton.tsx";

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
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: Router.getHomeUrl() },
          {
            title: projectContext.title,
            url: Router.getProjectPath(projectContext.id),
          },
        ]}
      ></CMSNavbar>
      <div className={"flex-grow-1"}>
        <Container className={"pb-5 pt-5"}>
          <Stack gap={5}>
            <Stack
              direction={"horizontal"}
              className={"justify-content-between"}
            >
              <CMSHeader
                title={projectContext.title}
                className={"user-select-text"}
              ></CMSHeader>
              <CMSButton
                title={"Edit Project"}
                icon={"pen"}
                link={Router.getProjectEditPath(projectContext.id)}
              ></CMSButton>
            </Stack>
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
                  <RoomCard
                    key={r.id}
                    room={r}
                    project={projectContext}
                  ></RoomCard>
                ))}
                <CMSEmptyHint list={projectContext.rooms}></CMSEmptyHint>
                <Card>
                  <NavbarButton
                    icon={"plus-lg"}
                    title={"Create Room"}
                    className={"p-1"}
                    onClick={() => {
                      roomControllerCreateRoom({
                        path: { projectId: projectContext.id },
                      })
                        .then(resultOrThrow)
                        .then(() => navigate(0))
                        .catch(console.error);
                    }}
                  ></NavbarButton>
                </Card>
              </Stack>
            </Stack>
            <Stack>
              <h5>Database Connections</h5>
              <Stack gap={3}>
                <Stack direction={"horizontal"} gap={3} className={"flex-wrap"}>
                  {projectContext.databases.map((r) => (
                    <DatabaseConnectionCard
                      key={r.id}
                      databaseConnection={r}
                      project={projectContext}
                    ></DatabaseConnectionCard>
                  ))}
                </Stack>
                <CMSEmptyHint list={projectContext.databases}></CMSEmptyHint>
                <Card className={"align-self-start"}>
                  <NavbarButton
                    icon={"plus-lg"}
                    title={"Add Database Connection"}
                    className={"p-1"}
                    onClick={() => {
                      databaseConnectionControllerCreateDatabaseConnection({
                        path: { projectId: projectContext.id },
                      })
                        .then(resultOrThrow)
                        .then(() => navigate(0))
                        .catch(console.error);
                    }}
                  ></NavbarButton>
                </Card>
              </Stack>
            </Stack>
            <Stack gap={3}>
              <Stack gap={5}>
                {projectContext.scenarioGroups.map((r) => (
                  <ScenarioGroupCard
                    key={r.id}
                    scenarioGroup={r}
                    project={projectContext}
                  ></ScenarioGroupCard>
                ))}
              </Stack>
              <CMSEmptyHint list={projectContext.scenarioGroups}></CMSEmptyHint>
              <Card>
                <NavbarButton
                  icon={"plus-lg"}
                  title={"Add Scenario Group"}
                  className={"p-1"}
                  onClick={() => {
                    scenarioGroupControllerCreateScenarioGroup({
                      path: { projectId: projectContext.id },
                    })
                      .then(resultOrThrow)
                      .then((r) =>
                        navigate(
                          Router.getEditScenarioGroupPath(
                            projectContext.id,
                            r.id,
                          ),
                        ),
                      )
                      .catch(console.error);
                  }}
                ></NavbarButton>
              </Card>
            </Stack>
          </Stack>
        </Container>
      </div>
    </Stack>
  );
}
