import { Alert, Stack } from "react-bootstrap";
import { AppNavbar } from "../shared/bars/AppNavbar.tsx";
import { NavbarLogo } from "../shared/bars/NavbarLogo.tsx";
import { InfoDropdown } from "../shared/bars/InfoDropdown.tsx";
import { StatusBar } from "../shared/bars/StatusBar.tsx";
import { AuthButton } from "../shared/auth/AuthButton.tsx";
import { SocketStateDisplay } from "../shared/socket/SocketStateDisplay.tsx";
import { AppContext } from "../state/AppContext.ts";
import {
  createRoom,
  getRoomTemplate,
  Room as RoomSchema,
  RoomTemplate as RoomTemplateSchema,
} from "../../src-gen";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { NavbarButton } from "../shared/elements/NavbarButton.tsx";
import { ToastStack } from "../shared/bars/ToastStack.tsx";

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
