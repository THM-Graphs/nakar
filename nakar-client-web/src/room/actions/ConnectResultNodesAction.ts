import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { postCanvasActionConnectResultNodes, Scenario } from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";

export type ConnectResultNodesActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: CanvasContext;
  scenario: Scenario | null;
};

export class ConnectResultNodesAction extends Action<ConnectResultNodesActionParams> {
  public static shared: ConnectResultNodesAction =
    new ConnectResultNodesAction();

  protected async action(input: ConnectResultNodesActionParams): Promise<void> {
    resultOrThrow(
      await postCanvasActionConnectResultNodes({
        path: { id: input.roomContext.initialCanvasData.id },
      }),
    );
  }

  disabled(input: ConnectResultNodesActionParams): boolean {
    return input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "intersect";
  }

  slug(): string {
    return "connect-result-nodes";
  }

  title(): string {
    return "Connect Result Nodes";
  }
}
