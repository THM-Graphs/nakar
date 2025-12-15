import { Action } from "./Action.ts";
import { postRoomActionExpandNode } from "../../../src-gen";
import { NodesActionParams } from "./NodesActionParams.ts";

export class ExpandNodeAction extends Action<NodesActionParams> {
  public static shared: ExpandNodeAction = new ExpandNodeAction();

  protected async action(input: NodesActionParams): Promise<void> {
    for (const node of input.nodes) {
      await postRoomActionExpandNode({
        path: {
          id: input.roomContext.initialRoomData.id,
        },
        body: {
          nodeId: node.id,
          limit: null,
        },
      });
    }
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length === 0;
  }

  icon(): string | null {
    return "zoom-in";
  }

  slug(): string {
    return "full-expand-nodes";
  }

  title(input: NodesActionParams): string {
    if (input.nodes.length === 1) {
      const node = input.nodes[0];
      if (node.isCluster) {
        return "Expand Cluster";
      } else {
        return "Expand Node";
      }
    } else if (input.nodes.length > 0) {
      return `Expand ${input.nodes.length.toFixed()} Nodes`;
    } else {
      return `Expand Nodes`;
    }
  }
}
