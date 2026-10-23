import { Action } from "./Action.ts";
import { CanvasTabActionParams } from "./CanvasTabActionParams.ts";
import { actionControllerCloseOtherCanvases } from "api-client";
import { Router } from "../../routing/Router.ts";

export class CloseOtherCanvasesAction extends Action<CanvasTabActionParams> {
  public static shared = new CloseOtherCanvasesAction();

  protected async action(input: CanvasTabActionParams): Promise<void> {
    if (this.disabled(input)) {
      return;
    }
    await input.execute(async () => {
      await actionControllerCloseOtherCanvases({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.canvas.id,
        },
        throwOnError: true,
      });
      if (
        input.isCurrent() &&
        input.canvas.id !== input.roomContext.initialCanvasData.id
      ) {
        await input.navigate(
          Router.getCanvasPath(
            input.roomContext.initialRoomData.id,
            input.canvas.id,
          ),
          { replace: true },
        );
      }
      await input.refresh();
    });
  }

  disabled(input: CanvasTabActionParams): boolean {
    return input.busy || input.canvasCount <= 1;
  }

  icon(): string {
    return "x-square";
  }

  slug(): string {
    return "close-other-canvases";
  }

  title(): string {
    return "Close Other Tabs";
  }
}
