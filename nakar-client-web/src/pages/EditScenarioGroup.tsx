import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Container, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import {
  projectControllerGetProject,
  ProjectPageDto,
  scenarioGroupControllerDeleteScenarioGroup,
  scenarioGroupControllerUpdateScenarioGroup,
  ScenarioGroupDto,
} from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";
import { CMSEditPageForm } from "../shared/cms/CMSEditPageForm.tsx";

type EditScenarioGroupLoaderData = {
  project: ProjectPageDto;
  scenarioGroup: ScenarioGroupDto;
};

export async function EditScenarioGroupLoader(
  args: LoaderFunctionArgs,
): Promise<EditScenarioGroupLoaderData> {
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
  };
}

export function EditScenarioGroup() {
  const loaderData: EditScenarioGroupLoaderData = useLoaderData();
  const [title, setTitle] = useState(loaderData.scenarioGroup.title);

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: Router.getHomePath() },
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
            title: "Edit",
            url: Router.getEditScenarioGroupPath(
              loaderData.project.id,
              loaderData.scenarioGroup.id,
            ),
          },
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <CMSEditPageForm
            onSave={async () => {
              await scenarioGroupControllerUpdateScenarioGroup({
                body: {
                  title: title,
                },
                path: {
                  projectId: loaderData.project.id,
                  scenarioGroupId: loaderData.scenarioGroup.id,
                },
              }).then(resultOrThrow);
            }}
            onDelete={async () => {
              await scenarioGroupControllerDeleteScenarioGroup({
                path: {
                  projectId: loaderData.project.id,
                  scenarioGroupId: loaderData.scenarioGroup.id,
                },
              }).then(resultOrThrow);
            }}
            closeUrl={Router.getProjectPath(loaderData.project.id)}
            afterDeleteUrl={Router.getProjectPath(loaderData.project.id)}
            entityTitleSingular={"Scenario Group"}
          >
            <CMSEditTextCard
              title={"Scenario Group Title"}
              value={title}
              onChange={setTitle}
            ></CMSEditTextCard>
          </CMSEditPageForm>
        </Container>
      </div>
    </Stack>
  );
}
