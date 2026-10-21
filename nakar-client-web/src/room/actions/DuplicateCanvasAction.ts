import { Action } from "./Action.ts";
import { CanvasTabActionParams } from "./CanvasTabActionParams.ts";
import { actionControllerDuplicateCanvas } from "api-client";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { Router } from "../../routing/Router.ts";

export class DuplicateCanvasAction extends Action<CanvasTabActionParams> {
  public static shared = new DuplicateCanvasAction();

  protected async action(input: CanvasTabActionParams): Promise<void> {
    if (this.disabled(input)) {
      return;
    }
    await input.execute(async () => {
      const canvas = resultOrThrow(
        await actionControllerDuplicateCanvas({
          path: {
            roomId: input.roomContext.initialRoomData.id,
            canvasId: input.canvas.id,
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
    return "copy";
  }

  slug(): string {
    return "duplicate-canvas";
  }

  title(): string {
    return "Duplicate Tab";
  }
}
