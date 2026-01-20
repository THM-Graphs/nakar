import { Button, Card, Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { match, P } from "ts-pattern";
import { useState } from "react";
import {
  projectControllerCreateProject,
  projectControllerDeleteProject,
  projectControllerGetProject,
  projectControllerUpdateProject,
  ProjectPageDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import {
  Link,
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
} from "react-router";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";

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
  const pageTitle = match(project)
    .with(P.nullish, () => "Create Project")
    .otherwise((p) => `Edit ${p.title}`);

  return (
    <Stack
      style={{ height: "100%", width: "100%" }}
      className={"justify-content-start bg-body-tertiary"}
    >
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: "/" },
          ...match(project)
            .with(P.nullish, () => [{ title: "Create Project", url: "#" }])
            .otherwise((p: ProjectPageDto) => [
              { title: p.title, url: `/project/${p.id}` },
              { title: "Edit", url: "#" },
            ]),
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={3}>
            <Stack
              direction={"horizontal"}
              className={"justify-content-between"}
            >
              <h1>{pageTitle}</h1>
            </Stack>
            <CMSErrorCard error={error}></CMSErrorCard>
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
              <Stack gap={3}>
                <Card className={"p-3"}>
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
                </Card>
                <Stack
                  direction={"horizontal"}
                  gap={3}
                  className={"justify-content-between"}
                >
                  <Stack direction={"horizontal"} gap={2}>
                    <Button
                      type={"submit"}
                      size={"sm"}
                      title={match(project)
                        .with(P.nullish, () => "Create Project")
                        .otherwise(() => "Save")}
                    >
                      <Stack direction={"horizontal"} gap={2}>
                        {match(project)
                          .with(P.nullish, () => (
                            <>
                              <i className={"bi bi-plus-lg"}></i>
                              <span>Create Project</span>
                            </>
                          ))
                          .otherwise(() => (
                            <>
                              <i className={"bi bi-floppy"}></i>
                              <span>Save</span>
                            </>
                          ))}
                      </Stack>
                    </Button>
                    <Link
                      to={match(project)
                        .with(P.nullish, () => "/")
                        .otherwise((p) => `/project/${p.id}`)}
                    >
                      <Button size={"sm"} variant={"secondary"}>
                        <Stack direction={"horizontal"} gap={2}>
                          <span>Cancel</span>
                        </Stack>
                      </Button>
                    </Link>
                  </Stack>
                  {loading && <Spinner variant={"primary"}></Spinner>}
                  {project != null && (
                    <Button
                      title={"Delete Project"}
                      variant={"danger"}
                      size={"sm"}
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
                            return navigate("/");
                          })
                          .catch((error: unknown) => {
                            setError(error);
                          })
                          .finally(() => {
                            setLoading(false);
                          });
                      }}
                    >
                      <Stack direction={"horizontal"} gap={2}>
                        <i className={"bi bi-trash"}></i>
                        <span className={""}>Delete Project</span>
                      </Stack>
                    </Button>
                  )}
                </Stack>
              </Stack>
            </Form>
          </Stack>
        </Container>
      </div>
    </Stack>
  );
}
