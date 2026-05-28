import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { actionControllerRedo } from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";

export type RedoActionParams = {
  roomContext: CanvasContextData;
  redoAction: string | null;
};

export class RedoAction extends Action<RedoActionParams> {
  public static shared: RedoAction = new RedoAction();

  protected async action(input: RedoActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerRedo({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(input: RedoActionParams): boolean {
    return !input.redoAction;
  }

  icon(): string {
    return "arrow-90deg-right";
  }

  slug(): string {
    return "redo";
  }

  title(): string {
    return "Redo";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Shift+z");
  }
}
