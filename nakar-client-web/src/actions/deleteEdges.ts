import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { Edge, postRoomActionDeleteElements } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";

export async function deleteEdges(edges: Edge[], roomContext: RoomContext) {
  await resultOrThrow(
    await postRoomActionDeleteElements({
      path: {
        id: roomContext.initialRoomData.id,
      },
      body: {
        nodes: [],
        labels: [],
        edges: edges.map((e) => e.id),
        edgeTypes: [],
      },
    }),
  );
}
