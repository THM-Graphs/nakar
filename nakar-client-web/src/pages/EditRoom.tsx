import { Container, Form, Spinner, Stack } from "react-bootstrap";
import { CMSNavbar } from "../shared/cms/CMSNavbar.tsx";
import { useState } from "react";
import {
  projectControllerGetProject,
  ProjectPageDto,
  roomControllerGetRoom,
  RoomDto,
} from "../../src-gen";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { CMSErrorCard } from "../shared/cms/CMSErrorCard.tsx";
import { CMSHeader } from "../shared/cms/CMSHeader.tsx";
import { CMSButton } from "../shared/cms/CMSButton.tsx";
import { CMSEditTextCard } from "../shared/cms/CMSEditTextCard.tsx";
import { Router } from "../routing/Router.ts";
import { RoomVisibilityEditor } from "../shared/cms/RoomVisibilityEditor.tsx";

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
    await roomControllerGetRoom({ path: { roomId: roomId } }),
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const navigate = useNavigate();

  return (
    <Stack className={""}>
      <CMSNavbar
        breadcrumbContext={[
          { title: "Home", url: Router.getHomeUrl() },
          {
            title: project.title,
            url: Router.getProjectPath(project.id),
          },
          {
            title: room.title,
            url: Router.getRoomEditUrl(project.id, room.id),
          },
          { title: "Edit", url: Router.getRoomEditUrl(project.id, room.id) },
        ]}
      ></CMSNavbar>
      <div className={"mb-auto pt-5 pb-5"}>
        <Container>
          <Stack gap={3}>
            <CMSHeader title={`Edit ${room.title}`}></CMSHeader>
            <CMSErrorCard error={error}></CMSErrorCard>
            <Form
              onSubmit={(event) => {
                event.preventDefault();
                setLoading(true);
                setError(null);
                // updateRoom({
                //   path: { roomId: room.id },
                //   body: {
                //     title: title,
                //   },
                // })
                //   .then(resultOrThrow)
                //   .then((result) => {
                //     return navigate(Router.getRoomEditUrl(result.id));
                //   })
                //   .catch((error: unknown) => {
                //     setError(error);
                //   })
                //   .finally(() => {
                //     setLoading(false);
                //   });
              }}
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
                      link={Router.getProjectPath(project.id)}
                      title={"Cancel"}
                      variant={"secondary"}
                    ></CMSButton>

                    {loading && (
                      <Spinner variant={"primary"} size={"sm"}></Spinner>
                    )}
                  </Stack>
                  <CMSButton
                    title={"Delete Room"}
                    icon={"trash"}
                    variant={"danger"}
                    onClick={(e) => {
                      e.preventDefault();

                      if (!confirm(`Delete Room ${room.title}?`)) {
                        return;
                      }

                      setLoading(true);
                      setError(null);
                      // deleteRoom({
                      //   path: { projectId: room.id },
                      // })
                      //   .then(resultOrThrow)
                      //   .then(() => {
                      //     return navigate(Router.getHomeUrl());
                      //   })
                      //   .catch((error: unknown) => {
                      //     setError(error);
                      //   })
                      //   .finally(() => {
                      //     setLoading(false);
                      //   });
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
