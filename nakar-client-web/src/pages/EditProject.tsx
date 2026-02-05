import { Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { useState } from "react";
import {
  projectControllerDeleteProject,
  projectControllerGetProject,
  projectControllerUpdateProject,
  ProjectPageDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";
import { Router } from "../routing/Router.ts";

export async function EditProjectLoader(
  args: LoaderFunctionArgs,
): Promise<ProjectPageDto> {
  const id: string | undefined = args.params["id"];

  if (id == null) {
    throw new Error("Project not found.");
  }

  const project: ProjectPageDto = resultOrThrow(
    await projectControllerGetProject({ path: { projectId: id } }),
  );

  return project;
}

export function EditProject() {
  const project: ProjectPageDto = useLoaderData();

  const [title, setTitle] = useState<string>(project.title);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: Router.getHomeUrl() },
          { title: project.title, url: Router.getProjectPath(project.id) },
          { title: "Edit", url: Router.getProjectEditPath(project.id) },
        ]}
      ></CMSNavbar>
      <div className={"mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={3}>
            <CMSHeader title={`Edit ${project.title}`}></CMSHeader>
            <CMSErrorCard error={error}></CMSErrorCard>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                setLoading(true);
                setError(null);
                projectControllerUpdateProject({
                  path: { projectId: project.id },
                  body: {
                    title: title,
                  },
                })
                  .then(resultOrThrow)
                  .then((result) => {
                    return navigate(Router.getProjectEditPath(result.id));
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
                <CMSEditTextCard
                  title={"Project Title"}
                  value={title}
                  onChange={setTitle}
                  subtitle={"This title will be shown on your start page."}
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
                      link={`/project/${project.id}`}
                      title={"Cancel"}
                      variant={"secondary"}
                    ></CMSButton>

                    {loading && (
                      <Spinner variant={"primary"} size={"sm"}></Spinner>
                    )}
                  </Stack>
                  <CMSButton
                    title={"Delete Project"}
                    icon={"trash"}
                    variant={"danger"}
                    onClick={(e) => {
                      e.preventDefault();

                      if (!confirm(`Delete Project ${project.title}?`)) {
                        return;
                      }

                      setLoading(true);
                      setError(null);
                      projectControllerDeleteProject({
                        path: { projectId: project.id },
                      })
                        .then(resultOrThrow)
                        .then(() => {
                          return navigate(Router.getHomeUrl());
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
