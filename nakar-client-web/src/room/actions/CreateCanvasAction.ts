import { Action } from "./Action.ts";
import { CanvasTabActionParams } from "./CanvasTabActionParams.ts";
import { actionControllerCreateCanvas } from "api-client";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { Router } from "../../routing/Router.ts";

export class CreateCanvasAction extends Action<CanvasTabActionParams> {
  public static shared = new CreateCanvasAction();

  protected async action(input: CanvasTabActionParams): Promise<void> {
    if (this.disabled(input)) {
      return;
    }
    await input.execute(async () => {
      const canvas = resultOrThrow(
        await actionControllerCreateCanvas({
          path: {
            roomId: input.roomContext.initialRoomData.id,
            canvasId: input.roomContext.initialCanvasData.id,
          },
        }),
      );
      if (input.isCurrent()) {
        await input.navigate(
          Router.getCanvasPath(input.roomContext.initialRoomData.id, canvas.id),
        );
      }
    });
  }

  disabled(input: CanvasTabActionParams): boolean {
    return input.busy;
  }

  icon(): string {
    return "plus-lg";
  }

  slug(): string {
    return "create-canvas";
  }

  title(): string {
    return "Add Canvas";
  }
}
