import { useEffect } from "react";
import { useBearStore } from "../state/useBearStore.ts";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";

import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { CanvasDto, roomControllerGetRoom, RoomDto } from "../../src-gen";

export type RoomContext = {
  room: RoomDto;
  canvas: CanvasDto;
};

export async function RoomLoader(
  args: LoaderFunctionArgs,
): Promise<RoomContext> {
  const roomId: string | undefined = args.params["id"];
  if (roomId == null) {
    throw new Error("No room id given.");
  }
  const room: RoomDto = resultOrThrow(
    await roomControllerGetRoom({ path: { roomId: roomId } }),
  );

  if (room.canvases.length === 0) {
    throw new Error("No canvas found.");
  }

  return {
    room: room,
    canvas: room.canvases[0],
  };
}

export function Room() {
  const addMyRoom = useBearStore((s) => s.start.addRoom);
  const roomContext: RoomContext = useLoaderData();
  const navigate = useNavigate();

  useEffect(() => {
    addMyRoom(roomContext.room.id);
    void navigate(`/canvas/${roomContext.canvas.id}`, { replace: true });
  }, [roomContext.room.id]);

  return null;
}
