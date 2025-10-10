import { Action } from "./Action.ts";
import { postRoomActionExpandNode } from "../../src-gen";
import { NodesActionParams } from "./NodesActionParams.ts";

export class ExpandNodeAction extends Action<NodesActionParams> {
  public static shared: ExpandNodeAction = new ExpandNodeAction();

  protected async action(input: NodesActionParams): Promise<void> {
    if (input.nodes.length !== 1) {
      throw new Error("Unable to expand multiple nodes.");
    }
    const node = input.nodes[0];
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

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length !== 1;
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
      }
    }
    return "Expand Node";
  }
}
