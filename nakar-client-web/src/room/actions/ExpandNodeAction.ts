import { Action } from "./Action.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerExpandNode } from "../../../src-gen";

export class ExpandNodeAction extends Action<NodesActionParams> {
  public static shared: ExpandNodeAction = new ExpandNodeAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await actionControllerExpandNode({
      path: {
        roomId: input.roomContext.initialRoomData.id,
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

  title(): string {
    return "Expand Node";
  }
}
