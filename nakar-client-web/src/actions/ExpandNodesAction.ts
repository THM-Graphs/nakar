import { Action } from "./Action.ts";
import {
  Node,
  postRoomActionExpandNode,
  postRoomActionExpandNodePreview,
} from "../../src-gen";
import { useBearStore } from "../lib/state/useBearStore.ts";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";

export type ExpandNodesActionParams = {
  nodes: Node[];
  roomContext: RoomContext;
};

export class ExpandNodesAction extends Action<ExpandNodesActionParams> {
  public static shared: ExpandNodesAction = new ExpandNodesAction();

  protected async action(input: ExpandNodesActionParams): Promise<void> {
    if (input.nodes.length !== 1) {
      throw new Error("Unable to expand multiple nodes.");
    }
    const node = input.nodes[0];
    if (node.isCluster) {
      await postRoomActionExpandNode({
        path: {
          id: input.roomContext.initialRoomData.id,
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
            id: input.roomContext.initialRoomData.id,
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
  }

  disabled(input: ExpandNodesActionParams): boolean {
    return input.nodes.length !== 1;
  }

  icon(): string | null {
    return "zoom-in";
  }

  slug(): string {
    return "expand-nodes";
  }

  title(input: ExpandNodesActionParams): string {
    if (input.nodes.length === 1) {
      const node = input.nodes[0];
      if (node.isCluster) {
        return "Expand Cluster";
      }
    }
    return "Expand Node";
  }
}
