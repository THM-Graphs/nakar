import { LoaderFunctionArgs, redirect } from "react-router";
import { publicRoomControllerGetRoom, RoomDto } from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { useBearStore } from "../state/useBearStore.ts";
import { Router } from "../routing/Router.ts";

export async function RoomLoader(args: LoaderFunctionArgs): Promise<void> {
  const roomId = args.params["roomId"];

  if (roomId == null) {
    throw new Error("No room id provided.");
  }

  const room: RoomDto = resultOrThrow(
    await publicRoomControllerGetRoom({ path: { roomId: roomId } }),
  );

  useBearStore.getState().start.addRoom(room.id);

  // eslint-disable-next-line @typescript-eslint/only-throw-error
  throw redirect(Router.getCanvasUrl(room.id, room.joinCanvasId));
}

export function Room() {
  return <></>;
}
