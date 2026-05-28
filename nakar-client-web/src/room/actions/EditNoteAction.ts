import { Action } from "./Action.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { NoteDto } from "api-client";

type EditNoteActionParams = { note: NoteDto; isLoggedIn: boolean };
export class EditNoteAction extends Action<EditNoteActionParams> {
  public static shared: EditNoteAction = new EditNoteAction();

  protected action(input: EditNoteActionParams): void {
    useBearStore
      .getState()
      .room.panels.notes.addNoteModal.showForUpdate(input.note);
  }

  disabled(input: EditNoteActionParams): boolean {
    return !input.isLoggedIn;
  }

  icon(): string | null {
    return "pencil";
  }

  slug(): string {
    return "edit-note";
  }

  title(): string {
    return "Edit Note";
  }
}
