import { Alert, Stack } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { NavbarLogo } from "../components/shared/NavbarLogo.tsx";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";
import { StatusBar } from "../components/shared/StatusBar.tsx";
import { AuthButton } from "../components/shared/auth/AuthButton.tsx";
import { SocketStateDisplay } from "../components/room/SocketStateDisplay.tsx";
import { AppContext } from "../lib/state/AppContext.ts";
import {
  createRoom,
  getRoomTemplate,
  RoomTemplate as RoomTemplateSchema,
  Room as RoomSchema,
} from "../../src-gen";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { NavbarButton } from "../components/shared/NavbarButton.tsx";
import { ToastStack } from "../components/room/ToastStack.tsx";

export async function RoomTemplateLoader(
  args: LoaderFunctionArgs,
): Promise<RoomTemplateSchema> {
  const roomTemplateId = args.params["id"];

  if (roomTemplateId == null) {
    throw new Error("No room-template id provided.");
  }

  const templates: RoomTemplateSchema = resultOrThrow(
    await getRoomTemplate({ path: { id: roomTemplateId } }),
  );
  return templates;
}

export function RoomTemplate(props: { context: AppContext }) {
  const loaderData: RoomTemplateSchema = useLoaderData();
  const navigate = useNavigate();

  const createRoomAndJoin = async (): Promise<void> => {
    const room: RoomSchema = resultOrThrow(
      await createRoom({ body: { templateId: loaderData.id } }),
    );
    await navigate(`/room/${room.id}`);
  };

  return (
    <Stack
      style={{ height: "100%", width: "100%" }}
      className={"justify-content-start"}
    >
      <AppNavbar
        left={
          <NavbarButton
            icon={"chevron-left"}
            onClick={async () => {
              await navigate("/");
            }}
          ></NavbarButton>
        }
        center={<NavbarLogo></NavbarLogo>}
        right={<InfoDropdown context={props.context}></InfoDropdown>}
      ></AppNavbar>

      <Stack className={"position-relative"}>
        <Stack className={"justify-content-start align-items-center p-5"}>
          <span className={"small text-muted"}>Room Template</span>
          <span className={"fs-2 user-select-text mb-5"}>
            {loaderData.title}
          </span>
          <NavbarButton
            title={"Create Room"}
            icon={"play-fill"}
            className={"border-top border-start border-end border-bottom"}
            onClick={createRoomAndJoin}
          ></NavbarButton>
          <span className={"text-muted mt-5"}>
            You’ll be redirected to your room once it’s created. You can
            collaborate with others by sharing your room’s browser link.
          </span>
          <Alert variant={"warning"} className={"mt-2"}>
            Anyone with access to the room link will be able to join.
          </Alert>
        </Stack>

        <ToastStack></ToastStack>
      </Stack>

      <StatusBar
        right={
          <Stack direction={"horizontal"}>
            <AuthButton></AuthButton>
            <SocketStateDisplay></SocketStateDisplay>
          </Stack>
        }
      ></StatusBar>
    </Stack>
  );
}
