import { Action } from "./Action.ts";
import { CanvasTabActionParams } from "./CanvasTabActionParams.ts";
import { actionControllerCloseCanvas } from "api-client";

export class CloseCanvasAction extends Action<CanvasTabActionParams> {
  public static shared = new CloseCanvasAction();

  protected async action(input: CanvasTabActionParams): Promise<void> {
    if (this.disabled(input)) {
      return;
    }
    await input.execute(async () => {
      await actionControllerCloseCanvas({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.canvas.id,
        },
        throwOnError: true,
      });
      await input.refresh();
    });
  }

  disabled(input: CanvasTabActionParams): boolean {
    return input.busy || input.canvasCount <= 1;
  }

  icon(): string {
    return "x-lg";
  }

  slug(): string {
    return "close-canvas";
  }

  title(): string {
    return "Close Tab";
  }
}
