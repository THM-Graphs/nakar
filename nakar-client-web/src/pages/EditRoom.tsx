import { Container, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { useState } from "react";
import {
  projectControllerGetProject,
  ProjectPageDto,
  roomControllerDeleteRoom,
  roomControllerGetRoom,
  roomControllerUpdateRoom,
  RoomDto,
} from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";
import { Router } from "../routing/Router.ts";
import { RoomVisibilityEditor } from "../shared/cms/RoomVisibilityEditor.tsx";
import { CMSEditPageForm } from "../shared/cms/CMSEditPageForm.tsx";

type EditRoomLoaderData = {
  room: RoomDto;
  project: ProjectPageDto;
};

export async function EditRoomLoader(
  args: LoaderFunctionArgs,
): Promise<EditRoomLoaderData> {
  const roomId: string | undefined = args.params["roomId"];
  const projectId: string | undefined = args.params["projectId"];

  if (roomId == null) {
    throw new Error("Room not found.");
  }
  if (projectId == null) {
    throw new Error("Project not found.");
  }

  const room: RoomDto = resultOrThrow(
    await roomControllerGetRoom({
      path: { roomId: roomId, projectId: projectId },
    }),
  );
  const project: ProjectPageDto = resultOrThrow(
    await projectControllerGetProject({ path: { projectId: projectId } }),
  );

  return {
    room: room,
    project: project,
  };
}

export function EditRoom() {
  const loaderData: EditRoomLoaderData = useLoaderData();
  const room = loaderData.room;
  const project = loaderData.project;

  const [title, setTitle] = useState<string>(room.title);
  const [visibility, setVisibility] = useState<RoomDto["visibility"]>(
    room.visibility,
  );

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: Router.getHomePath() },
          {
            title: project.title,
            url: Router.getProjectPath(project.id),
          },
          {
            title: room.title,
            url: Router.getRoomEditPath(project.id, room.id),
          },
          { title: "Edit", url: Router.getRoomEditPath(project.id, room.id) },
        ]}
      ></CMSNavbar>
      <div className={"mb-auto pt-5 pb-5"}>
        <Container>
          <CMSEditPageForm
            onSave={async () => {
              await roomControllerUpdateRoom({
                path: { roomId: room.id, projectId: project.id },
                body: {
                  title: title,
                  visibility: visibility,
                },
              }).then(resultOrThrow);
            }}
            onDelete={async () => {
              await roomControllerDeleteRoom({
                path: { roomId: room.id, projectId: project.id },
              }).then(resultOrThrow);
            }}
            closeUrl={Router.getProjectPath(project.id)}
            afterDeleteUrl={Router.getProjectPath(project.id)}
            entityTitleSingular={"Room"}
          >
            <Stack gap={3}>
              <CMSEditTextCard
                title={"Room Title"}
                value={title}
                onChange={setTitle}
                subtitle={"This title will be shown on your start page."}
              ></CMSEditTextCard>
              <RoomVisibilityEditor
                value={visibility}
                onChange={setVisibility}
              ></RoomVisibilityEditor>
            </Stack>
          </CMSEditPageForm>
        </Container>
      </div>
    </Stack>
  );
}
