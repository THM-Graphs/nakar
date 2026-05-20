import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerFlipCanvas } from "../../../src-gen";
import { FlipCanvasActionParams } from "./FlipCanvasActionParams.ts";
import { createAppShortcut } from "./createAppShortcut.ts";

export class FlipCanvasHorizontalAction extends Action<FlipCanvasActionParams> {
  public static shared: FlipCanvasHorizontalAction =
    new FlipCanvasHorizontalAction();

  protected async action(input: FlipCanvasActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerFlipCanvas({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          axis: "x",
        },
      }),
    );
  }

  disabled(input: FlipCanvasActionParams): boolean {
    return input.nodeCount === 0 || input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "symmetry-horizontal";
  }

  slug(): string {
    return "flip-canvas-horizontal";
  }

  title(): string {
    return "Flip Horizontal";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Shift+h");
  }
}
