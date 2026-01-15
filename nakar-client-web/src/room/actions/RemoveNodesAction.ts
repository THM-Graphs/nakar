import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerDeleteElements } from "../../../src-gen";

export class RemoveNodesAction extends Action<NodesActionParams> {
  public static shared: RemoveNodesAction = new RemoveNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerDeleteElements({
        path: {
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          nodes: input.nodes.map((n) => n.id),
          labels: [],
          edges: [],
          edgeTypes: [],
        },
      }),
    );
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length === 0;
  }

  icon(): string | null {
    return "eye-slash";
  }

  slug(): string {
    return "remove-nodes";
  }

  title(): string {
    return "Remove Node";
  }
}
