import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import {
  actionControllerConnectResultNodes,
  ScenarioDto,
} from "../../../src-gen";

export type ConnectResultNodesActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: CanvasContext;
  scenario: ScenarioDto | null;
};

export class ConnectResultNodesAction extends Action<ConnectResultNodesActionParams> {
  public static shared: ConnectResultNodesAction =
    new ConnectResultNodesAction();

  protected async action(input: ConnectResultNodesActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerConnectResultNodes({
        path: { canvasId: input.roomContext.initialCanvasData.id },
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
