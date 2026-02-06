import { Action } from "./Action.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { canvasDatabaseConnectionControllerExpandNodePreview } from "../../../src-gen";

export class ExpandNodePreviewAction extends Action<NodesActionParams> {
  public static shared: ExpandNodePreviewAction = new ExpandNodePreviewAction();

  protected async action(input: NodesActionParams): Promise<void> {
    if (input.nodes.length !== 1) {
      throw new Error("Unable to expand multiple nodes.");
    }
    const node = input.nodes[0];
    useBearStore.getState().room.scenario.expandNodePreview.open(null);
    const result = resultOrThrow(
      await canvasDatabaseConnectionControllerExpandNodePreview({
        path: {
          canvasId: input.roomContext.initialCanvasData.id,
          databaseId: node.sourceId,
        },
        query: { nodeId: node.id },
      }),
    );
    useBearStore.getState().room.scenario.expandNodePreview.open({
      relationships: result.relationships,
      labels: result.labels,
      nodeId: node.id,
    });
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length !== 1 || input.nodes[0].isCluster;
  }

  icon(): string | null {
    return "zoom-in";
  }

  slug(): string {
    return "expand-node-preview";
  }

  title(): string {
    return "Expand Node (Preview)";
  }
}
