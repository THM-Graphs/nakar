import { Action, ActionShortcut } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerDeleteElements } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export class RemoveLabelAction extends Action<LabelActionParams> {
  public static shared: RemoveLabelAction = new RemoveLabelAction();

  protected async action(input: LabelActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerDeleteElements({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          nodes: [],
          labels: input.labels,
          edges: [],
          edgeTypes: [],
        },
      }),
    );
  }

  disabled(input: LabelActionParams): boolean {
    return input.labels.length === 0;
  }

  icon(): string | null {
    return "trash";
  }

  slug(): string {
    return "remove-label";
  }

  title(): string {
    return "Remove Label";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Backspace");
  }
}
