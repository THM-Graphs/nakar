import { Action } from "./Action.ts";
import { useBearStore } from "../state/useBearStore.ts";
import { Note } from "../../src-gen";

type EditNoteActionParams = { note: Note };
export class EditNoteAction extends Action<EditNoteActionParams> {
  public static shared: EditNoteAction = new EditNoteAction();

  protected action(input: EditNoteActionParams): void {
    useBearStore
      .getState()
      .room.panels.notes.addNoteModal.showForUpdate(input.note);
  }

  disabled(): boolean {
    return false;
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
