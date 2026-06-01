import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Container, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import {
  databaseConnectionControllerDeleteDatabaseConnection,
  databaseConnectionControllerGetDatabaseConnection,
  databaseConnectionControllerUpdateDatabaseConnection,
  DatabaseConnectionDto,
  projectControllerGetProject,
  ProjectPageDto,
  UpdateDatabaseConnectionRequestBodyDto,
} from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { CMSEditPageForm } from "../shared/cms/CMSEditPageForm.tsx";
import { DatabaseConnectionEditor } from "../shared/cms/DatabaseConnectionEditor.tsx";

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
            title: loaderData.databaseConnection.title,
            url: Router.getDatabaseConnectionEditPath(
              loaderData.project.id,
              loaderData.databaseConnection.id,
            ),
          },
          {
            title: "Edit",
            url: Router.getDatabaseConnectionEditPath(
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
            <DatabaseConnectionEditor
              value={databaseConnection}
              onChange={setDatabaseConnection}
              project={loaderData.project}
              initialDatabase={loaderData.databaseConnection}
            ></DatabaseConnectionEditor>
          </CMSEditPageForm>
        </Container>
      </div>
    </Stack>
  );
}
