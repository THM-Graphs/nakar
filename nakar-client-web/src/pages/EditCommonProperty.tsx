import { useState } from "react";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { Container, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import {
  commonPropertiesControllerDeleteCommonProperty,
  commonPropertiesControllerUpdateCommonProperty,
  CommonPropertyDto,
  projectControllerGetProject,
  ProjectPageDto,
  UpdateCommonPropertyRequestBodyDto,
} from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { Router } from "../routing/Router.ts";
import { CMSEditPageForm } from "../shared/cms/CMSEditPageForm.tsx";
import { CommonPropertyEditor } from "../shared/cms/CommonPropertyEditor.tsx";

type EditCommonPropertyLoaderData = {
  project: ProjectPageDto;
  commonProperty: CommonPropertyDto;
};

export async function EditCommonPropertyLoader(
  args: LoaderFunctionArgs,
): Promise<EditCommonPropertyLoaderData> {
  const projectId = args.params["projectId"];
  if (projectId == null) {
    throw new Error("Project not found.");
  }

  const project = resultOrThrow(
    await projectControllerGetProject({ path: { projectId: projectId } }),
  );

  const commonPropertyId = args.params["commonPropertyId"];
  if (commonPropertyId == null) {
    throw new Error("Common property id not found.");
  }
  const commonProperty = project.commonProperties.find(
    (sg) => sg.id === commonPropertyId,
  );
  if (commonProperty == null) {
    throw new Error("Common property not found.");
  }

  return {
    project: project,
    commonProperty: commonProperty,
  };
}

export function EditCommonProperty() {
  const loaderData: EditCommonPropertyLoaderData = useLoaderData();
  const [state, setState] = useState<UpdateCommonPropertyRequestBodyDto>({
    leftLabel: loaderData.commonProperty.leftLabel,
    leftProperty: loaderData.commonProperty.leftProperty,
    rightLabel: loaderData.commonProperty.rightLabel,
    rightProperty: loaderData.commonProperty.rightProperty,
    leftDatabaseId: loaderData.commonProperty.leftDatabase?.id ?? "",
    rightDatabaseId: loaderData.commonProperty.rightDatabase?.id ?? "",
  });

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
            title: "Common Property",
            url: Router.getCommonPropertyEditUrl(
              loaderData.project.id,
              loaderData.commonProperty.id,
            ),
          },
          {
            title: "Edit",
            url: Router.getCommonPropertyEditUrl(
              loaderData.project.id,
              loaderData.commonProperty.id,
            ),
          },
        ]}
      ></CMSNavbar>
      <div className={"overflow-auto mb-auto pt-5 pb-5"}>
        <Container>
          <CMSEditPageForm
            onSave={async () => {
              await commonPropertiesControllerUpdateCommonProperty({
                body: state,
                path: {
                  projectId: loaderData.project.id,
                  commonPropertyId: loaderData.commonProperty.id,
                },
              }).then(resultOrThrow);
            }}
            onDelete={async () => {
              await commonPropertiesControllerDeleteCommonProperty({
                path: {
                  projectId: loaderData.project.id,
                  commonPropertyId: loaderData.commonProperty.id,
                },
              }).then(resultOrThrow);
            }}
            closeUrl={Router.getProjectPath(loaderData.project.id)}
            afterDeleteUrl={Router.getProjectPath(loaderData.project.id)}
            entityTitleSingular={"Common Property"}
          >
            <CommonPropertyEditor
              value={state}
              onChange={setState}
              project={loaderData.project}
            ></CommonPropertyEditor>
          </CMSEditPageForm>
        </Container>
      </div>
    </Stack>
  );
}
