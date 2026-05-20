import { Action, ActionShortcut } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerReloadScenario } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export type RerunScenarioActionParams = {
  roomContext: CanvasContextData;
};

export class RerunScenarioAction extends Action<RerunScenarioActionParams> {
  public static shared: RerunScenarioAction = new RerunScenarioAction();

  protected async action(input: RerunScenarioActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerReloadScenario({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(): boolean {
    return false;
  }

  icon(): string | null {
    return "arrow-clockwise";
  }

  slug(): string {
    return "rerun-scenario";
  }

  title(): string {
    return "Rerun Scenario";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Enter");
  }
}
