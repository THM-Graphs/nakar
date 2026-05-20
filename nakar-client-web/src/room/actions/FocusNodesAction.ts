import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerFocusNodes } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export class FocusNodesAction extends Action<NodesActionParams> {
  public static shared: FocusNodesAction = new FocusNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerFocusNodes({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: { nodes: input.nodes.map((n) => n.id) },
      }),
    );
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length === 0;
  }

  icon(): string | null {
    return "binoculars";
  }

  slug(): string {
    return "focus-nodes";
  }

  title(): string {
    return "Focus Node";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+f");
  }
}
