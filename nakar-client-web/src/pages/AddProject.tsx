import { Card, Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { useState } from "react";
import {
  projectControllerCreateProject,
  UpdateDatabaseConnectionRequestBodyDto,
} from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { useNavigate } from "react-router";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";
import { Router } from "../routing/Router.ts";
import { DatabaseConnectionEditor } from "../shared/cms/DatabaseConnectionEditor.tsx";

export function AddProject() {
  const [title, setTitle] = useState<string>("Untitled Project");
  const [createDemoScenarios, setCreateDemoScenarios] = useState(true);
  const [databaseConnection, setDatabaseConnection] =
    useState<UpdateDatabaseConnectionRequestBodyDto>({
      title: "Main Database",
      databaseType: "neo4j",
      username: null,
      password: null,
      credentialStoreConsent: false,
      browserUrl: "",
      connectionUrl: "",
      database: "",
      nodeConfigurations: [],
      language: null,
    });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: "/" },
          { title: "Create Project", url: "#" },
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={3}>
            <CMSHeader title={"Create Project"}></CMSHeader>
            <CMSErrorCard error={error}></CMSErrorCard>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                setLoading(true);
                setError(null);
                projectControllerCreateProject({
                  body: {
                    title: title,
                    createDemoScenarios,
                    databaseConnection: createDemoScenarios
                      ? databaseConnection
                      : undefined,
                  },
                })
                  .then(resultOrThrow)
                  .then((result) => {
                    return navigate(Router.getProjectPath(result.id));
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
                <Card className={"p-3"}>
                  <Stack gap={3}>
                    <Form.Check
                      id={"create-demo-scenarios"}
                      label={"Create Demo Scenarios"}
                      checked={createDemoScenarios}
                      onChange={(event) => {
                        setCreateDemoScenarios(event.target.checked);
                      }}
                    ></Form.Check>
                    {createDemoScenarios && (
                      <Stack gap={3}>
                        <h5 className={"mb-0"}>Database Connection</h5>
                        <DatabaseConnectionEditor
                          value={databaseConnection}
                          onChange={setDatabaseConnection}
                          initialDatabase={null}
                        ></DatabaseConnectionEditor>
                      </Stack>
                    )}
                  </Stack>
                </Card>
                <Stack
                  direction={"horizontal"}
                  gap={3}
                  className={"justify-content-between"}
                >
                  <Stack direction={"horizontal"} gap={2}>
                    <CMSButton
                      title={"Create Project"}
                      icon={"plus-lg"}
                      type={"submit"}
                    ></CMSButton>
                    <CMSButton
                      title={"Cancel"}
                      link={"/"}
                      variant={"secondary"}
                    ></CMSButton>
                    {loading && (
                      <Spinner variant={"primary"} size={"sm"}></Spinner>
                    )}
                  </Stack>
                </Stack>
              </Stack>
            </Form>
          </Stack>
        </Container>
      </div>
    </Stack>
  );
}
