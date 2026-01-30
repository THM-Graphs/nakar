import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import {
  CreateScenarioQueryEntryDto,
  DatabaseConnectionDto,
  projectControllerDeleteProject,
  projectControllerGetProject,
  ProjectPageDto,
  scenarioControllerDeleteScenario,
  scenarioControllerUpdateScenario,
  ScenarioDto,
  ScenarioGroupDto,
  ScenarioQueryDto,
  UpdateScenarioQueryEntryDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { ScenarioData, ScenarioEditor } from "../shared/cms/ScenarioEditor.tsx";
import { QueryEntry } from "../shared/cms/QueryEditor.tsx";

type EditScenarioLoaderData = {
  project: ProjectPageDto;
  scenarioGroup: ScenarioGroupDto;
  databases: DatabaseConnectionDto[];
  scenario: ScenarioDto;
};

export async function EditScenarioLoader(
  args: LoaderFunctionArgs,
): Promise<EditScenarioLoaderData> {
  const projectId = args.params["projectId"];
  if (projectId == null) {
    throw new Error("Project not found.");
  }

  const project = resultOrThrow(
    await projectControllerGetProject({ path: { projectId: projectId } }),
  );

  const scenarioGroupId = args.params["scenarioGroupId"];
  if (scenarioGroupId == null) {
    throw new Error("Scenario Group not found.");
  }
  const scenarioGroup = project.scenarioGroups.find(
    (sg) => sg.id === scenarioGroupId,
  );
  if (scenarioGroup == null) {
    throw new Error("Scenario Group not found.");
  }

  const scenarioId = args.params["scenarioId"];
  if (scenarioId == null) {
    throw new Error("Scenario not found.");
  }
  const scenario = scenarioGroup.scenarios.find((sg) => sg.id === scenarioId);
  if (scenario == null) {
    throw new Error("Scenario not found.");
  }

  return {
    project: project,
    scenarioGroup: scenarioGroup,
    databases: project.databases,
    scenario: scenario,
  };
}

export function EditScenario() {
  const loaderData: EditScenarioLoaderData = useLoaderData();
  const [scenario, setScenario] = useState<ScenarioData>({
    title: loaderData.scenario.title ?? "",
    queries: loaderData.scenario.queries.map(
      (query: ScenarioQueryDto): QueryEntry => {
        return {
          id: query.id,
          query: query.query,
          databaseId: query.database?.id ?? "",
          isTableData: query.isTableQuery,
        };
      },
    ),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: "/" },
          {
            title: loaderData.project.title,
            url: Router.getProjectPath(loaderData.project.id),
          },
          {
            title: loaderData.scenario.title ?? loaderData.scenario.id,
            url: Router.getEditScenarioPath(
              loaderData.project.id,
              loaderData.scenarioGroup.id,
              loaderData.scenario.id,
            ),
          },
          {
            title: "Edit",
            url: Router.getEditScenarioPath(
              loaderData.project.id,
              loaderData.scenarioGroup.id,
              loaderData.scenario.id,
            ),
          },
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={3}>
            <CMSHeader title={"Edit Scenario"}></CMSHeader>
            <CMSErrorCard error={error}></CMSErrorCard>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                setLoading(true);
                setError(null);
                scenarioControllerUpdateScenario({
                  body: {
                    title: scenario.title,
                    queries: scenario.queries.map(
                      (query: QueryEntry): UpdateScenarioQueryEntryDto => {
                        return {
                          id: query.id,
                          query: query.query,
                          databaseId: query.databaseId,
                          isTableQuery: query.isTableData,
                        };
                      },
                    ),
                  },
                  path: {
                    scenarioId: loaderData.scenario.id,
                    projectId: loaderData.project.id,
                    scenarioGroupId: loaderData.scenarioGroup.id,
                  },
                })
                  .then(resultOrThrow)
                  .then((result) => {
                    return navigate(
                      Router.getProjectPath(loaderData.project.id),
                    );
                  })
                  .catch((error: unknown) => {
                    setError(error);
                  })
                  .finally(() => {
                    setLoading(false);
                  });
              }}
            >
              <Stack gap={3}>
                <ScenarioEditor
                  value={scenario}
                  onChange={setScenario}
                  databases={loaderData.databases}
                ></ScenarioEditor>

                <hr></hr>

                <Stack
                  direction={"horizontal"}
                  gap={3}
                  className={"justify-content-between"}
                >
                  <Stack direction={"horizontal"} gap={2}>
                    <CMSButton
                      title={"Save"}
                      icon={"floppy"}
                      type={"submit"}
                    ></CMSButton>
                    <CMSButton
                      title={"Cancel"}
                      link={Router.getProjectPath(loaderData.project.id)}
                      variant={"secondary"}
                    ></CMSButton>
                    {loading && (
                      <Spinner variant={"primary"} size={"sm"}></Spinner>
                    )}
                  </Stack>
                  <CMSButton
                    title={"Delete Scenario"}
                    icon={"trash"}
                    variant={"danger"}
                    onClick={(e) => {
                      e.preventDefault();

                      if (
                        !confirm(
                          `Delete Scenario ${loaderData.scenario.title ?? "untitled"}?`,
                        )
                      ) {
                        return;
                      }

                      setLoading(true);
                      setError(null);
                      scenarioControllerDeleteScenario({
                        path: {
                          projectId: loaderData.project.id,
                          scenarioGroupId: loaderData.scenarioGroup.id,
                          scenarioId: loaderData.scenario.id,
                        },
                      })
                        .then(resultOrThrow)
                        .then(() => {
                          return navigate(
                            Router.getProjectPath(loaderData.project.id),
                          );
                        })
                        .catch((error: unknown) => {
                          setError(error);
                        })
                        .finally(() => {
                          setLoading(false);
                        });
                    }}
                  ></CMSButton>
                </Stack>
              </Stack>
            </Form>
          </Stack>
        </Container>
      </div>
    </Stack>
  );
}
