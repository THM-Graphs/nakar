import { Action, ActionShortcut } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { actionControllerConnectResultNodes } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export type ConnectResultNodesActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: CanvasContextData;
};

export class ConnectResultNodesAction extends Action<ConnectResultNodesActionParams> {
  public static shared: ConnectResultNodesAction =
    new ConnectResultNodesAction();

  protected async action(input: ConnectResultNodesActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerConnectResultNodes({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(input: ConnectResultNodesActionParams): boolean {
    return input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "link-45deg";
  }

  slug(): string {
    return "connect-result-nodes";
  }

  title(): string {
    return "Connect Result Nodes";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Shift+c");
  }
}
