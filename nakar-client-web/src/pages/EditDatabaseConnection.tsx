import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import {
  Alert,
  Button,
  Card,
  Col,
  Container,
  Form,
  Row,
  Spinner,
  Stack,
} from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import {
  databaseConnectionControllerDeleteDatabaseConnection,
  databaseConnectionControllerGetDatabaseConnection,
  databaseConnectionControllerTestDatabaseConnection,
  databaseConnectionControllerUpdateDatabaseConnection,
  DatabaseConnectionDto,
  projectControllerGetProject,
  ProjectPageDto,
  TestDatabaseConnectionResponseBodyDto,
  UpdateDatabaseConnectionRequestBodyDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { CMSEditPageForm } from "../shared/cms/CMSEditPageForm.tsx";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { handleError } from "../shared/error/handleError.ts";

type EditDatabaseConnectionLoaderData = {
  project: ProjectPageDto;
  databaseConnection: DatabaseConnectionDto;
};

export async function EditDatabaseConnectionLoader(
  args: LoaderFunctionArgs,
): Promise<EditDatabaseConnectionLoaderData> {
  const projectId = args.params["projectId"];
  if (projectId == null) {
    throw new Error("Project not found.");
  }

  const project = resultOrThrow(
    await projectControllerGetProject({ path: { projectId: projectId } }),
  );

  const databaseConnectionId = args.params["databaseConnectionId"];
  if (databaseConnectionId == null) {
    throw new Error("Database connection not found.");
  }
  const databaseConnection: DatabaseConnectionDto = resultOrThrow(
    await databaseConnectionControllerGetDatabaseConnection({
      path: {
        projectId: projectId,
        databaseConnectionId: databaseConnectionId,
      },
    }),
  );

  return {
    project: project,
    databaseConnection: databaseConnection,
  };
}

export function EditDatabaseConnection() {
  const loaderData: EditDatabaseConnectionLoaderData = useLoaderData();
  const [databaseConnection, setDatabaseConnection] =
    useState<UpdateDatabaseConnectionRequestBodyDto>({
      ...loaderData.databaseConnection,
      username: null,
      password: null,
      credentialStoreConsent: false,
    });
  const [testResult, setTestResult] =
    useState<TestDatabaseConnectionResponseBodyDto | null>(null);
  const [testResultLoading, setTestResultLoading] = useState<boolean>(false);

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
            title: loaderData.databaseConnection.title,
            url: Router.getDatabaseConnectionEditUrl(
              loaderData.project.id,
              loaderData.databaseConnection.id,
            ),
          },
          {
            title: "Edit",
            url: Router.getDatabaseConnectionEditUrl(
              loaderData.project.id,
              loaderData.databaseConnection.id,
            ),
          },
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <CMSEditPageForm
            onSave={async () => {
              await databaseConnectionControllerUpdateDatabaseConnection({
                body: databaseConnection,
                path: {
                  projectId: loaderData.project.id,
                  databaseConnectionId: loaderData.databaseConnection.id,
                },
              }).then(resultOrThrow);
            }}
            onDelete={async () => {
              await databaseConnectionControllerDeleteDatabaseConnection({
                path: {
                  projectId: loaderData.project.id,
                  databaseConnectionId: loaderData.databaseConnection.id,
                },
              }).then(resultOrThrow);
            }}
            closeUrl={Router.getProjectPath(loaderData.project.id)}
            afterDeleteUrl={Router.getProjectPath(loaderData.project.id)}
            entityTitleSingular={"Database Connection"}
          >
            <Card className={"p-3"}>
              <Stack gap={3}>
                <Row>
                  <Col>
                    <Form.Group>
                      <Form.Label>
                        Title <span className={"text-danger"}>*</span>
                      </Form.Label>
                      <Form.Control
                        placeholder={"My Database"}
                        value={databaseConnection.title}
                        onChange={(e) => {
                          setDatabaseConnection((d) => ({
                            ...d,
                            title: e.target.value,
                          }));
                        }}
                      ></Form.Control>
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group>
                      <Form.Label>Browser URL</Form.Label>
                      <Form.Control
                        placeholder={
                          "Example: https://my-database.com:7473/browser/"
                        }
                        value={databaseConnection.browserUrl}
                        onChange={(e) => {
                          setDatabaseConnection((d) => ({
                            ...d,
                            browserUrl: e.target.value,
                          }));
                        }}
                      ></Form.Control>
                    </Form.Group>
                  </Col>
                </Row>
              </Stack>
            </Card>

            <Stack>
              <h5>Credentials</h5>
              <Stack gap={1}>
                <Card className={"p-3"}>
                  <Stack gap={3}>
                    <Row>
                      <Col>
                        <Form.Group>
                          <Form.Label>
                            Connection URL{" "}
                            <span className={"text-danger"}>*</span>
                          </Form.Label>
                          <Form.Control
                            placeholder={
                              "Example: neo4j+s://my-database.com:7687"
                            }
                            value={databaseConnection.connectionUrl}
                            onChange={(e) => {
                              setDatabaseConnection((d) => ({
                                ...d,
                                connectionUrl: e.target.value,
                              }));
                            }}
                          ></Form.Control>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col>
                        <Form.Group>
                          <Form.Label>Username</Form.Label>
                          <Stack
                            direction={"horizontal"}
                            gap={0}
                            className={"position-relative"}
                          >
                            <Form.Control
                              placeholder={"Leave empty if unchanged"}
                              value={databaseConnection.username ?? ""}
                              autoComplete={"off"}
                              onChange={(e) => {
                                setDatabaseConnection((d) => ({
                                  ...d,
                                  username: e.target.value,
                                }));
                              }}
                            ></Form.Control>
                            {databaseConnection.username != null && (
                              <Button
                                onClick={() => {
                                  setDatabaseConnection((db) => ({
                                    ...db,
                                    username: null,
                                  }));
                                }}
                                className={"bi bi-x-lg position-absolute end-0"}
                                variant={"icon"}
                              ></Button>
                            )}
                          </Stack>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>Password</Form.Label>
                          <Stack className={"position-relative"}>
                            <Form.Control
                              placeholder={"Leave empty if unchanged"}
                              type={"password"}
                              autoComplete={"new-password"}
                              value={databaseConnection.password ?? ""}
                              onChange={(e) => {
                                setDatabaseConnection((d) => ({
                                  ...d,
                                  password: e.target.value,
                                }));
                              }}
                            ></Form.Control>
                            {databaseConnection.password != null && (
                              <Button
                                onClick={() => {
                                  setDatabaseConnection((db) => ({
                                    ...db,
                                    password: null,
                                  }));
                                }}
                                className={"bi bi-x-lg position-absolute end-0"}
                                variant={"icon"}
                              ></Button>
                            )}
                          </Stack>
                        </Form.Group>
                      </Col>
                      <Col>
                        <Form.Group>
                          <Form.Label>Database Name</Form.Label>
                          <Form.Control
                            placeholder={"Example: neo4j"}
                            value={databaseConnection.database}
                            onChange={(e) => {
                              setDatabaseConnection((d) => ({
                                ...d,
                                database: e.target.value,
                              }));
                            }}
                          ></Form.Control>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Stack direction={"horizontal"} gap={3}>
                      <CMSButton
                        icon={"database-check"}
                        title={"Test Connection"}
                        className={"align-self-start"}
                        onClick={(e) => {
                          e.preventDefault();
                          setTestResult(null);
                          setTestResultLoading(true);
                          databaseConnectionControllerTestDatabaseConnection({
                            path: { projectId: loaderData.project.id },
                            body: {
                              id: loaderData.databaseConnection.id,
                              username: databaseConnection.username,
                              password: databaseConnection.password,
                              database: databaseConnection.database,
                              connectionUrl: databaseConnection.connectionUrl,
                            },
                          })
                            .then(resultOrThrow)
                            .then((result) => {
                              setTestResult(result);
                            })
                            .catch((error: unknown) => {
                              setTestResult({
                                success: false,
                                message: handleError(error),
                              });
                            })
                            .finally(() => {
                              setTestResultLoading(false);
                            });
                        }}
                      ></CMSButton>
                      {testResultLoading && (
                        <Spinner size={"sm"} variant={"primary"}></Spinner>
                      )}
                    </Stack>
                    {testResult && (
                      <Alert
                        variant={testResult.success ? "success" : "danger"}
                        dismissible
                        onClose={() => {
                          setTestResult(null);
                        }}
                      >
                        {testResult.message}
                      </Alert>
                    )}
                  </Stack>
                </Card>

                {(databaseConnection.username != null ||
                  databaseConnection.password != null) && (
                  <Card className={"p-3"}>
                    <Form.Group>
                      <Form.Check
                        id={"consent"}
                        className={"d-flex align-items-center gap-3"}
                        checked={databaseConnection.credentialStoreConsent}
                        onChange={(e) => {
                          setDatabaseConnection((db) => ({
                            ...db,
                            credentialStoreConsent: e.target.checked,
                          }));
                        }}
                        label={
                          <Stack>
                            <span>
                              I consent to my database credentials being stored
                              on the server using server-side encryption for
                              application functionality.{" "}
                              <span className={"text-danger"}>*</span>
                            </span>
                            <span className={"text-muted"}>
                              The server only connects to databases using READ
                              mode.
                            </span>
                          </Stack>
                        }
                      ></Form.Check>
                    </Form.Group>
                  </Card>
                )}
              </Stack>
            </Stack>
          </CMSEditPageForm>
        </Container>
      </div>
    </Stack>
  );
}
