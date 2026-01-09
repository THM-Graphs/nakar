import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { actionControllerUndo } from "../../../src-gen-2";

export type UndoActionParams = {
  roomContext: CanvasContext;
  undoAction: string | null;
};

export class UndoAction extends Action<UndoActionParams> {
  public static shared: UndoAction = new UndoAction();

  protected async action(input: UndoActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerUndo({
        path: {
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

  title(params: UndoActionParams): string {
    if (params.undoAction == null) {
      return "Undo";
    } else {
      return `Undo '${params.undoAction}'`;
    }
  }
}
