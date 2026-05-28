import { Action, ActionShortcut } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { actionControllerUnlockAllNodes, NodeDto } from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";

export type UnlockAllNodesActionParams = {
  nodes: NodeDto[];
  roomContext: CanvasContextData;
  selectedTab: SelectedCanvasTab;
};

export class UnlockAllNodesAction extends Action<UnlockAllNodesActionParams> {
  public static shared: UnlockAllNodesAction = new UnlockAllNodesAction();

  protected async action(input: UnlockAllNodesActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerUnlockAllNodes({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(input: UnlockAllNodesActionParams): boolean {
    return input.nodes.length === 0 || input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "unlock";
  }

  slug(): string {
    return "unlock-all-nodes";
  }

  title(): string {
    return "Unlock All Nodes";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Shift+u");
  }
}
