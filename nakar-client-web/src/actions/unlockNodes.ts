import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { Node, postRoomActionUnlockNodes } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";

export async function unlockNodes(nodes: Node[], roomContext: RoomContext) {
  await resultOrThrow(
    await postRoomActionUnlockNodes({
      path: { id: roomContext.initialRoomData.id },
      body: {
        nodes: nodes.map((n) => n.id),
      },
    }),
  );
}
