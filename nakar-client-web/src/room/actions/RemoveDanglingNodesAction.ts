import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import {
  postCanvasActionRemoveDanglingNodes,
  Scenario,
} from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";

export type RemoveDanglingNodesActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: CanvasContext;
  scenario: Scenario | null;
};

export class RemoveDanglingNodesAction extends Action<RemoveDanglingNodesActionParams> {
  public static shared: RemoveDanglingNodesAction =
    new RemoveDanglingNodesAction();

  protected async action(
    input: RemoveDanglingNodesActionParams,
  ): Promise<void> {
    resultOrThrow(
      await postCanvasActionRemoveDanglingNodes({
        path: { id: input.roomContext.initialCanvasData.id },
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
