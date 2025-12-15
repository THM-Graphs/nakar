import { Action } from "./Action.ts";
import { RoomContext } from "../../pages/Room.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { Node, postRoomActionUnlockAllNodes } from "../../../src-gen";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";

export type UnlockAllNodesActionParams = {
  nodes: Node[];
  roomContext: RoomContext;
  selectedTab: SelectedCanvasTab;
};

export class UnlockAllNodesAction extends Action<UnlockAllNodesActionParams> {
  public static shared: UnlockAllNodesAction = new UnlockAllNodesAction();

  protected async action(input: UnlockAllNodesActionParams): Promise<void> {
    resultOrThrow(
      await postRoomActionUnlockAllNodes({
        path: { id: input.roomContext.initialRoomData.id },
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
