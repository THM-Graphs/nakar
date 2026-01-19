import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { noteControllerDeleteNote } from "../../../src-gen";

export type RemoveNoteActionParams = {
  noteId: string;
  roomContext: CanvasContext;
  isLoggedIn: boolean;
};
export class RemoveNoteAction extends Action<RemoveNoteActionParams> {
  public static shared: RemoveNoteAction = new RemoveNoteAction();

  protected async action(input: RemoveNoteActionParams): Promise<void> {
    await resultOrThrow(
      await noteControllerDeleteNote({
        path: {
          noteId: input.noteId,
          roomId: input.roomContext.initialRoomData.id,
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
