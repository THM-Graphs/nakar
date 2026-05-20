import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerFlipCanvas } from "../../../src-gen";
import { FlipCanvasActionParams } from "./FlipCanvasActionParams.ts";
import { createAppShortcut } from "./createAppShortcut.ts";

export class FlipCanvasVerticalAction extends Action<FlipCanvasActionParams> {
  public static shared: FlipCanvasVerticalAction =
    new FlipCanvasVerticalAction();

  protected async action(input: FlipCanvasActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerFlipCanvas({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          axis: "y",
        },
      }),
    );
  }

  disabled(input: FlipCanvasActionParams): boolean {
    return input.nodeCount === 0 || input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "symmetry-vertical";
  }

  slug(): string {
    return "flip-canvas-vertical";
  }

  title(): string {
    return "Flip Vertical";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Shift+v");
  }
}
