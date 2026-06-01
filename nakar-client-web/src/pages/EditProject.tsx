import { Container, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { useState } from "react";
import {
  projectControllerDeleteProject,
  projectControllerGetProject,
  projectControllerUpdateProject,
  ProjectPageDto,
} from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";
import { Router } from "../routing/Router.ts";
import { CMSEditPageForm } from "../shared/cms/CMSEditPageForm.tsx";

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

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: Router.getHomePath() },
          { title: project.title, url: Router.getProjectPath(project.id) },
          { title: "Edit", url: Router.getProjectEditPath(project.id) },
        ]}
      ></CMSNavbar>
      <div className={"mb-auto pt-5 pb-5"}>
        <Container>
          <CMSEditPageForm
            onSave={async () => {
              await projectControllerUpdateProject({
                path: { projectId: project.id },
                body: {
                  title: title,
                },
              }).then(resultOrThrow);
            }}
            onDelete={async () => {
              await projectControllerDeleteProject({
                path: { projectId: project.id },
              }).then(resultOrThrow);
            }}
            closeUrl={Router.getProjectPath(project.id)}
            afterDeleteUrl={Router.getHomePath()}
            entityTitleSingular={"Project"}
          >
            <CMSEditTextCard
              title={"Project Title"}
              value={title}
              onChange={setTitle}
              subtitle={"This title will be shown on your start page."}
            ></CMSEditTextCard>
          </CMSEditPageForm>
        </Container>
      </div>
    </Stack>
  );
}
