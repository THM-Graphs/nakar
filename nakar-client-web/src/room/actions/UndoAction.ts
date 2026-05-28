import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { actionControllerUndo } from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";

export type UndoActionParams = {
  roomContext: CanvasContextData;
  undoAction: string | null;
};

export class UndoAction extends Action<UndoActionParams> {
  public static shared: UndoAction = new UndoAction();

  protected async action(input: UndoActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerUndo({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(input: UndoActionParams): boolean {
    return !input.undoAction;
  }

  icon(): string {
    return "arrow-90deg-left";
  }

  slug(): string {
    return "undo";
  }

  title(): string {
    return "Undo";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+z");
  }
}
