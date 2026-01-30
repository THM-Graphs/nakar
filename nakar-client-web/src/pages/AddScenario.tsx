import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import {
  CreateScenarioQueryEntryDto,
  DatabaseConnectionDto,
  projectControllerGetProject,
  ProjectPageDto,
  scenarioControllerCreateScenario,
  ScenarioGroupDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { ScenarioData, ScenarioEditor } from "../shared/cms/ScenarioEditor.tsx";
import { QueryEntry } from "../shared/cms/QueryEditor.tsx";

type AddScenarioLoaderData = {
  project: ProjectPageDto;
  scenarioGroup: ScenarioGroupDto;
  databases: DatabaseConnectionDto[];
};

export async function AddScenarioLoader(
  args: LoaderFunctionArgs,
): Promise<AddScenarioLoaderData> {
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

  return {
    project: project,
    scenarioGroup: scenarioGroup,
    databases: project.databases,
  };
}

export function AddScenario() {
  const loaderData: AddScenarioLoaderData = useLoaderData();
  const [scenario, setScenario] = useState<ScenarioData>({
    title: "Untitled Scenario",
    queries: [],
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
            title: "Create Scenario",
            url: "#",
          },
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              scenarioControllerCreateScenario({
                body: {
                  title: scenario.title,
                  queries: scenario.queries.map(
                    (query: QueryEntry): CreateScenarioQueryEntryDto => {
                      return {
                        query: query.query,
                        databaseId: query.databaseId,
                        isTableQuery: query.isTableData,
                      };
                    },
                  ),
                },
                path: {
                  projectId: loaderData.project.id,
                  scenarioGroupId: loaderData.scenarioGroup.id,
                },
              })
                .then(resultOrThrow)
                .then((result) => {
                  return navigate(
                    Router.getEditScenarioPath(
                      loaderData.project.id,
                      loaderData.scenarioGroup.id,
                      result.id,
                    ),
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
            <Stack gap={5}>
              <CMSHeader title={"Create Scenario"}></CMSHeader>
              <CMSErrorCard error={error}></CMSErrorCard>
              <ScenarioEditor
                value={scenario}
                onChange={setScenario}
                databases={loaderData.databases}
              ></ScenarioEditor>

              <Stack
                direction={"horizontal"}
                gap={3}
                className={"justify-content-between"}
              >
                <Stack direction={"horizontal"} gap={2}>
                  <CMSButton
                    title={"Create Scenario"}
                    icon={"plus-lg"}
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
              </Stack>
            </Stack>
          </Form>
        </Container>
      </div>
    </Stack>
  );
}
