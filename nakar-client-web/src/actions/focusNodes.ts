import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { postRoomActionFocusNodes, Node } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";

export async function focusNodes(nodes: Node[], roomContext: RoomContext) {
  await resultOrThrow(
    await postRoomActionFocusNodes({
      path: {
        id: roomContext.initialRoomData.id,
      },
      body: { nodes: nodes.map((n) => n.id) },
    }),
  );
}
