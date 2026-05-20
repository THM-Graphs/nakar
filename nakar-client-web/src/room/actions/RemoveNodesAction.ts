import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerDeleteElements } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export class RemoveNodesAction extends Action<NodesActionParams> {
  public static shared: RemoveNodesAction = new RemoveNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerDeleteElements({
        path: {
          roomId: input.roomContext.initialRoomData.id,
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
    return "trash";
  }

  slug(): string {
    return "remove-nodes";
  }

  title(): string {
    return "Remove Node";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("Backspace");
  }
}
