import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Row,
  Spinner,
  Stack,
} from "react-bootstrap";
import { CMSButton } from "./CMSButton.tsx";
import { useState } from "react";
import {
  databaseConnectionControllerTestDatabaseConnection,
  DatabaseConnectionDto,
  ProjectPageDto,
  TestDatabaseConnectionResponseBodyDto,
  UpdateDatabaseConnectionRequestBodyDto,
} from "../../../src-gen";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import clsx from "clsx";
import { handleError } from "../error/handleError.ts";
import { NodeConfigurationsEditor } from "./NodeConfigurationsEditor.tsx";

export function DatabaseConnectionEditor(props: {
  value: UpdateDatabaseConnectionRequestBodyDto;
  onChange: (newValue: UpdateDatabaseConnectionRequestBodyDto) => void;
  project: ProjectPageDto;
  initialDatabase: DatabaseConnectionDto | null;
}) {
  const [testResult, setTestResult] =
    useState<TestDatabaseConnectionResponseBodyDto | null>(null);
  const [testResultLoading, setTestResultLoading] = useState<boolean>(false);

  return (
    <>
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
                  value={props.value.title}
                  onChange={(e) => {
                    props.onChange({
                      ...props.value,
                      title: e.target.value,
                    });
                  }}
                ></Form.Control>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group>
                <Form.Label>Browser URL</Form.Label>
                <Form.Control
                  placeholder={"Example: https://my-database.com:7473/browser/"}
                  value={props.value.browserUrl}
                  onChange={(e) => {
                    props.onChange({
                      ...props.value,
                      browserUrl: e.target.value,
                    });
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
                      Connection URL <span className={"text-danger"}>*</span>
                    </Form.Label>
                    <Form.Control
                      placeholder={"Example: neo4j+s://my-database.com:7687"}
                      value={props.value.connectionUrl}
                      onChange={(e) => {
                        props.onChange({
                          ...props.value,
                          connectionUrl: e.target.value,
                        });
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
                        value={props.value.username ?? ""}
                        autoComplete={"off"}
                        onChange={(e) => {
                          props.onChange({
                            ...props.value,
                            username: e.target.value,
                          });
                        }}
                      ></Form.Control>
                      {props.value.username != null && (
                        <Button
                          onClick={() => {
                            props.onChange({
                              ...props.value,
                              username: null,
                            });
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
                        value={props.value.password ?? ""}
                        onChange={(e) => {
                          props.onChange({
                            ...props.value,
                            password: e.target.value,
                          });
                        }}
                      ></Form.Control>
                      {props.value.password != null && (
                        <Button
                          onClick={() => {
                            props.onChange({
                              ...props.value,
                              password: null,
                            });
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
                      value={props.value.database}
                      onChange={(e) => {
                        props.onChange({
                          ...props.value,
                          database: e.target.value,
                        });
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
                      path: { projectId: props.project.id },
                      body: {
                        id: props.initialDatabase?.id ?? null,
                        username: props.value.username,
                        password: props.value.password,
                        database: props.value.database,
                        connectionUrl: props.value.connectionUrl,
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

          {(props.value.username != null || props.value.password != null) && (
            <Card
              className={clsx(
                "p-3",
                !props.value.credentialStoreConsent && "bg-danger-subtle",
              )}
            >
              <Form.Group>
                <Form.Check
                  id={"consent"}
                  className={"d-flex align-items-center gap-3"}
                  checked={props.value.credentialStoreConsent}
                  onChange={(e) => {
                    props.onChange({
                      ...props.value,
                      credentialStoreConsent: e.target.checked,
                    });
                  }}
                  label={
                    <Stack>
                      <span>
                        I agree that the database login credentials I provide
                        will be stored in encrypted form on the server for the
                        purpose of enabling access to the database. I also
                        confirm that the information stored in the provided
                        database consists exclusively of{" "}
                        <strong>publicly accessible research data</strong> and
                        does not contain any personal, confidential, or
                        otherwise sensitive data.{" "}
                        <span className={"text-danger"}>*</span>
                      </span>
                    </Stack>
                  }
                ></Form.Check>
              </Form.Group>
            </Card>
          )}
        </Stack>
      </Stack>
      <NodeConfigurationsEditor
        value={props.value.nodeConfigurations}
        onChange={(n) => {
          props.onChange({
            ...props.value,
            nodeConfigurations: n,
          });
        }}
      ></NodeConfigurationsEditor>
    </>
  );
}
