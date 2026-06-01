import { LoaderFunctionArgs, replace } from "react-router";
import { publicRoomControllerGetRoom, RoomDto } from "api-client";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { useBearStore } from "../state/useBearStore.ts";
import { Router } from "../routing/Router.ts";

export async function RoomLoader(args: LoaderFunctionArgs): Promise<Response> {
  const roomId = args.params["roomId"];

  if (roomId == null) {
    throw new Error("No room id provided.");
  }

  const room: RoomDto = resultOrThrow(
    await publicRoomControllerGetRoom({ path: { roomId: roomId } }),
  );

  useBearStore.getState().start.addRoom(room.id);

  const url: URL = new URL(Router.getCanvasUrl(room.id, room.joinCanvasId));
  url.search = window.location.search;

  return replace(url.toString());
}

export function Room() {
  return <></>;
}
