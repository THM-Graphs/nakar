import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { noteControllerDeleteNote } from "../../../src-gen-2";

export type RemoveNoteActionParams = {
  noteId: string;
  roomContext: CanvasContext;
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

  disabled(): boolean {
    return false;
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
