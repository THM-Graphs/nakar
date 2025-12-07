import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { postRoomActionConnectResultNodes, Scenario } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";

export type ConnectResultNodesActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: RoomContext;
  scenario: Scenario | null;
};

export class ConnectResultNodesAction extends Action<ConnectResultNodesActionParams> {
  public static shared: ConnectResultNodesAction =
    new ConnectResultNodesAction();

  protected async action(input: ConnectResultNodesActionParams): Promise<void> {
    resultOrThrow(
      await postRoomActionConnectResultNodes({
        path: { id: input.roomContext.initialRoomData.id },
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
