import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { actionControllerRelayout } from "../../../src-gen-2";
import { Node } from "../../../src-gen";

export type RelayoutActionParams = {
  roomContext: CanvasContext;
  nodes: Node[];
  selectedTab: SelectedCanvasTab;
};
export class RelayoutAction extends Action<RelayoutActionParams> {
  public static shared: RelayoutAction = new RelayoutAction();

  protected async action(input: RelayoutActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerRelayout({
        path: { canvasId: input.roomContext.initialCanvasData.id },
      }),
    );
  }

  disabled(input: RelayoutActionParams): boolean {
    return input.nodes.length === 0 || input.selectedTab !== "graph";
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
