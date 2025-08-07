import { useBearStore } from "../lib/state/useBearStore.ts";
import {
  Node,
  postRoomActionExpandNode,
  postRoomActionExpandNodePreview,
} from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";

export async function expandNode(node: Node, roomContext: RoomContext) {
  try {
    if (node.isCluster) {
      await postRoomActionExpandNode({
        path: {
          id: roomContext.initialRoomData.id,
        },
        body: {
          nodeId: node.id,
          limit: { labels: [], relationships: [] },
        },
      });
    } else {
      useBearStore.getState().room.scenario.expandNodePreview.open(null);
      const result = resultOrThrow(
        await postRoomActionExpandNodePreview({
          path: {
            id: roomContext.initialRoomData.id,
          },
          body: { nodeId: node.id },
        }),
      );
      if (result != null) {
        useBearStore.getState().room.scenario.expandNodePreview.open({
          relationships: result.relationships,
          labels: result.labels,
          nodeId: node.id,
        });
      }
    }
  } catch (error: unknown) {
    useBearStore.getState().room.ui.pushErrorNotification(error);
  }
}
