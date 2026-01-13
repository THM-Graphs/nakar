import { Action } from "./Action.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { actionControllerUnlockAllNodes, NodeDto } from "../../../src-gen";

export type UnlockAllNodesActionParams = {
  nodes: NodeDto[];
  roomContext: CanvasContext;
  selectedTab: SelectedCanvasTab;
};

export class UnlockAllNodesAction extends Action<UnlockAllNodesActionParams> {
  public static shared: UnlockAllNodesAction = new UnlockAllNodesAction();

  protected async action(input: UnlockAllNodesActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerUnlockAllNodes({
        path: { canvasId: input.roomContext.initialCanvasData.id },
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
}
