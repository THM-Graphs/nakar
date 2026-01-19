import { Button, Container, Form, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { CMSFooter } from "../shared/cms/CMSFooter.tsx";
import { match, P } from "ts-pattern";
import { useState } from "react";
import {
  projectControllerCreateProject,
  projectControllerGetProject,
  projectControllerUpdateProject,
  ProjectPageDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import { Loading } from "../shared/elements/Loading.tsx";
import { CMSCard } from "../shared/cms/CMSCard.tsx";

export async function AddEditProjectLoader(
  args: LoaderFunctionArgs,
): Promise<ProjectPageDto | null> {
  const id: string | undefined = args.params["id"];

  if (id == null) {
    return null;
  }

  const project: ProjectPageDto = resultOrThrow(
    await projectControllerGetProject({ path: { projectId: id } }),
  );

  return project;
}

export function AddEditProject() {
  const project: ProjectPageDto | null = useLoaderData();

  const [title, setTitle] = useState<string>(
    project?.title ?? "Untitled Project",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  return (
    <Stack
      style={{ height: "100%", width: "100%" }}
      className={"justify-content-start bg-body-tertiary"}
    >
      <CMSNavbar
        backUrl={match(project)
          .with(P.nullish, () => "/")
          .otherwise((p) => `/project/${p.id}`)}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={5}>
            <h1 className={"user-select-text"}>
              {match(project)
                .with(P.nullish, () => "Create Project")
                .otherwise(() => "Edit Project")}
            </h1>
            <CMSErrorCard error={error}></CMSErrorCard>
            <CMSCard className={"p-3"}>
              <Form
                onSubmit={(event) => {
                  event.preventDefault();
                  setLoading(true);
                  setError(null);
                  match(project)
                    .returnType<Promise<ProjectPageDto>>()
                    .with(P.nullish, () =>
                      projectControllerCreateProject({
                        body: {
                          title: title,
                        },
                      }).then(resultOrThrow),
                    )
                    .otherwise((p) =>
                      projectControllerUpdateProject({
                        path: { projectId: p.id },
                        body: {
                          title: title,
                        },
                      }).then(resultOrThrow),
                    )
                    .then((result) => {
                      return navigate(`/project/${result.id}`);
                    })
                    .catch((error: unknown) => {
                      setError(error);
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                }}
              >
                <Form.Group className="mb-3">
                  <Form.Label>Project Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Project Title"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                  />
                  <Form.Text className="text-muted">
                    This title will be shown on your start page.
                  </Form.Text>
                </Form.Group>

                <Stack direction={"horizontal"} gap={3}>
                  <Button variant="primary" type="submit">
                    {match(project)
                      .with(P.nullish, () => "Create Project")
                      .otherwise(() => "Save")}
                  </Button>
                  {loading && <Loading></Loading>}
                </Stack>
              </Form>
            </CMSCard>
          </Stack>
        </Container>
      </div>
      <CMSFooter></CMSFooter>
    </Stack>
  );
}
