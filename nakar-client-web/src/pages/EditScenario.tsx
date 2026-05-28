import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Container, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import {
  DatabaseConnectionDto,
  projectControllerGetProject,
  ProjectPageDto,
  scenarioControllerDeleteScenario,
  scenarioControllerUpdateScenario,
  ScenarioDto,
  ScenarioGroupDto,
  ScenarioParameterDto,
  ScenarioQueryDto,
  UpdateScenarioQueryEntryDto,
  UpdateScenarioQueryParameterEntryDto,
  UpdateScenarioRequestBodyDto,
} from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { ScenarioEditor } from "../shared/cms/ScenarioEditor.tsx";
import { CMSEditPageForm } from "../shared/cms/CMSEditPageForm.tsx";

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
  const [scenario, setScenario] = useState<UpdateScenarioRequestBodyDto>({
    title: loaderData.scenario.title ?? "",
    description: loaderData.scenario.description ?? "",
    queries: loaderData.scenario.queries.map(
      (query: ScenarioQueryDto): UpdateScenarioQueryEntryDto => {
        return {
          id: query.id,
          query: query.query,
          databaseId: query.database?.id ?? "",
          isTableQuery: query.isTableQuery,
        };
      },
    ),
    parameters: loaderData.scenario.parameters.map(
      (
        parameter: ScenarioParameterDto,
      ): UpdateScenarioQueryParameterEntryDto => ({
        ...parameter,
        defaultValue: parameter.defaultValue ?? "",
        allowedLabels: parameter.allowedLabels,
      }),
    ),
    postScenarioActions: loaderData.scenario.postScenarioActions.map((psa) => ({
      ...psa,
      type: psa.type === "none" ? "connectResultNodes" : psa.type,
      layoutAlgorithm:
        psa.layoutAlgorithm === "none" ? "circle" : psa.layoutAlgorithm,
    })),
  });

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
            title: loaderData.scenarioGroup.title,
            url: Router.getEditScenarioGroupPath(
              loaderData.project.id,
              loaderData.scenarioGroup.id,
            ),
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
          <CMSEditPageForm
            onSave={async () => {
              const result = await scenarioControllerUpdateScenario({
                body: scenario,
                path: {
                  scenarioId: loaderData.scenario.id,
                  projectId: loaderData.project.id,
                  scenarioGroupId: loaderData.scenarioGroup.id,
                },
              });
              resultOrThrow(result);
            }}
            onDelete={async () => {
              const result = await scenarioControllerDeleteScenario({
                path: {
                  projectId: loaderData.project.id,
                  scenarioGroupId: loaderData.scenarioGroup.id,
                  scenarioId: loaderData.scenario.id,
                },
              });
              resultOrThrow(result);
            }}
            closeUrl={Router.getProjectPath(loaderData.project.id)}
            afterDeleteUrl={Router.getProjectPath(loaderData.project.id)}
            entityTitleSingular={"Scenario"}
          >
            <ScenarioEditor
              value={scenario}
              onChange={setScenario}
              databases={loaderData.databases}
            ></ScenarioEditor>
          </CMSEditPageForm>
        </Container>
      </div>
    </Stack>
  );
}
