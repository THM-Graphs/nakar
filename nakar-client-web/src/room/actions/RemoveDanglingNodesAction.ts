import { Action, ActionShortcut } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { actionControllerRemoveDanglingNodes } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export type RemoveDanglingNodesActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: CanvasContextData;
};

export class RemoveDanglingNodesAction extends Action<RemoveDanglingNodesActionParams> {
  public static shared: RemoveDanglingNodesAction =
    new RemoveDanglingNodesAction();

  protected async action(
    input: RemoveDanglingNodesActionParams,
  ): Promise<void> {
    resultOrThrow(
      await actionControllerRemoveDanglingNodes({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(input: RemoveDanglingNodesActionParams): boolean {
    return input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "slash-circle";
  }

  slug(): string {
    return "remove-dangling-nodes";
  }

  title(): string {
    return "Remove Dangling Nodes";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Shift+d");
  }
}
