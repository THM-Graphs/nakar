import { Action, ActionShortcut } from "./Action.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import {
  canvasDatabaseConnectionControllerExpandNodePreview,
  NodeDto,
} from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";
import { handleError } from "../../shared/error/handleError.ts";

export class ExpandNodePreviewAction extends Action<NodesActionParams> {
  public static shared: ExpandNodePreviewAction = new ExpandNodePreviewAction();

  protected async action(input: NodesActionParams): Promise<void> {
    if (input.nodes.length !== 1) {
      throw new Error("Unable to expand multiple nodes.");
    }
    const node: NodeDto = input.nodes[0];
    useBearStore
      .getState()
      .room.scenario.expandNodePreview.open({ type: "loading" });
    try {
      const result = resultOrThrow(
        await canvasDatabaseConnectionControllerExpandNodePreview({
          path: {
            roomId: input.roomContext.initialRoomData.id,
            canvasId: input.roomContext.initialCanvasData.id,
            databaseId: node.sourceId,
          },
          query: { nodeId: node.id },
        }),
      );
      useBearStore.getState().room.scenario.expandNodePreview.open({
        type: "data",
        relationships: result.relationships,
        labels: result.labels,
        nodeId: node.id,
        selectedRelationships: new Set<string>(),
        selectedLabels: new Set<string>(),
      });
    } catch (error: unknown) {
      useBearStore.getState().room.scenario.expandNodePreview.open({
        type: "error",
        error: handleError(error),
      });
    }
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length !== 1 || input.nodes[0].isCluster;
  }

  icon(): string | null {
    return "search";
  }

  slug(): string {
    return "expand-node-preview";
  }

  title(): string {
    return "Expand Preview";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Alt+KeyE");
  }
}
