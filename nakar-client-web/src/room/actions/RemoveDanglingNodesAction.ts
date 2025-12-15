import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { postRoomActionRemoveDanglingNodes, Scenario } from "../../../src-gen";
import { RoomContext } from "../../pages/Room.tsx";

export type RemoveDanglingNodesActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: RoomContext;
  scenario: Scenario | null;
};

export class RemoveDanglingNodesAction extends Action<RemoveDanglingNodesActionParams> {
  public static shared: RemoveDanglingNodesAction =
    new RemoveDanglingNodesAction();

  protected async action(
    input: RemoveDanglingNodesActionParams,
  ): Promise<void> {
    resultOrThrow(
      await postRoomActionRemoveDanglingNodes({
        path: { id: input.roomContext.initialRoomData.id },
      }),
    );
  }

  disabled(input: RemoveDanglingNodesActionParams): boolean {
    return input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "eye-slash";
  }

  slug(): string {
    return "remove-dangling-nodes";
  }

  title(): string {
    return "Remove Dangling Nodes";
  }
}
