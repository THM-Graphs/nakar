import { Action, ActionShortcut } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerCompressNodes } from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";

export class CompressLabelsAction extends Action<LabelActionParams> {
  public static shared: CompressLabelsAction = new CompressLabelsAction();

  protected async action(input: LabelActionParams): Promise<void> {
    if (input.labels.length !== 1) {
      // TODO: Allow
      throw new Error("Unable to compress multiple labels.");
    }
    const label = input.labels[0];
    resultOrThrow(
      await actionControllerCompressNodes({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          label: label,
        },
      }),
    );
  }

  disabled(input: LabelActionParams): boolean {
    return input.labels.length !== 1;
  }

  icon(): string | null {
    return "arrows-collapse";
  }

  slug(): string {
    return "compress-label";
  }

  title(): string {
    return "Compress Label";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Alt+Shift+KeyC");
  }
}
