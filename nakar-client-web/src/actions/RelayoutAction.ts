import { Action } from "./Action.ts";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { Node, postRoomActionRelayout } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";
import { SelectedCanvasTab } from "../lib/state/SelectedCanvasTab.ts";

export type RelayoutActionParams = {
  roomContext: RoomContext;
  nodes: Node[];
  uiLocked: boolean;
  selectedTab: SelectedCanvasTab;
};
export class RelayoutAction extends Action<RelayoutActionParams> {
  public static shared: RelayoutAction = new RelayoutAction();

  protected async action(input: RelayoutActionParams): Promise<void> {
    resultOrThrow(
      await postRoomActionRelayout({
        path: { id: input.roomContext.initialRoomData.id },
      }),
    );
  }

  disabled(input: RelayoutActionParams): boolean {
    return (
      input.nodes.length === 0 ||
      input.uiLocked ||
      input.selectedTab !== "graph"
    );
  }

  icon(): string | null {
    return "tropical-storm";
  }

  slug(): string {
    return "relayout";
  }

  title(): string {
    return "Relayout";
  }
}
