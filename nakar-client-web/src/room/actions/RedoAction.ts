import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { actionControllerRedo } from "../../../src-gen";

export type RedoActionParams = {
  roomContext: CanvasContext;
  redoAction: string | null;
};

export class RedoAction extends Action<RedoActionParams> {
  public static shared: RedoAction = new RedoAction();

  protected async action(input: RedoActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerRedo({
        path: {
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
}
