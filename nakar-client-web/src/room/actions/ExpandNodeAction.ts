import { Action } from "./Action.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerExpandNode } from "../../../src-gen-2";

export class ExpandNodeAction extends Action<NodesActionParams> {
  public static shared: ExpandNodeAction = new ExpandNodeAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await actionControllerExpandNode({
      path: {
        canvasId: input.roomContext.initialCanvasData.id,
      },
      body: {
        nodeIds: input.nodes.map((node) => node.id),
        limit: null,
      },
    });
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
