import { Node, postRoomActionDeleteElements } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";

export async function deleteNodes(nodes: Node[], roomContext: RoomContext) {
  await resultOrThrow(
    await postRoomActionDeleteElements({
      path: {
        id: roomContext.initialRoomData.id,
      },
      body: {
        nodes: nodes.map((n) => n.id),
        labels: [],
        edges: [],
        edgeTypes: [],
      },
    }),
  );
}
