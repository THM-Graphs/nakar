import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { canvasNoteControllerDeleteNote } from "api-client";

export type RemoveNoteActionParams = {
  noteId: string;
  roomContext: CanvasContextData;
  isLoggedIn: boolean;
};
export class RemoveNoteAction extends Action<RemoveNoteActionParams> {
  public static shared: RemoveNoteAction = new RemoveNoteAction();

  protected async action(input: RemoveNoteActionParams): Promise<void> {
    resultOrThrow(
      await canvasNoteControllerDeleteNote({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          noteId: input.noteId,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(input: RemoveNoteActionParams): boolean {
    return !input.isLoggedIn;
  }

  icon(): string | null {
    return "trash";
  }

  slug(): string {
    return "remove-note";
  }

  title(): string {
    return "Remove Note";
  }
}
