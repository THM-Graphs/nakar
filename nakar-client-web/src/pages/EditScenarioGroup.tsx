import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import {
  projectControllerGetProject,
  ProjectPageDto,
  scenarioGroupControllerDeleteScenarioGroup,
  scenarioGroupControllerUpdateScenarioGroup,
  ScenarioGroupDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: Router.getHomeUrl() },
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
          <Form
            onSubmit={(event) => {
              event.preventDefault();
              setLoading(true);
              setError(null);
              scenarioGroupControllerUpdateScenarioGroup({
                body: {
                  title: title,
                },
                path: {
                  projectId: loaderData.project.id,
                  scenarioGroupId: loaderData.scenarioGroup.id,
                },
              })
                .then(() => {
                  return navigate(Router.getProjectPath(loaderData.project.id));
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
              <CMSHeader
                title={`Edit ${loaderData.scenarioGroup.title}`}
              ></CMSHeader>
              <CMSErrorCard error={error}></CMSErrorCard>

              <CMSEditTextCard
                title={"Scenario Group Title"}
                value={title}
                onChange={setTitle}
              ></CMSEditTextCard>

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
                  title={"Delete Scenario Group"}
                  icon={"trash"}
                  variant={"danger"}
                  onClick={(e) => {
                    e.preventDefault();

                    if (
                      !confirm(
                        `Delete Scenario ${loaderData.scenarioGroup.title}?`,
                      )
                    ) {
                      return;
                    }

                    setLoading(true);
                    setError(null);
                    scenarioGroupControllerDeleteScenarioGroup({
                      path: {
                        projectId: loaderData.project.id,
                        scenarioGroupId: loaderData.scenarioGroup.id,
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
        </Container>
      </div>
    </Stack>
  );
}
