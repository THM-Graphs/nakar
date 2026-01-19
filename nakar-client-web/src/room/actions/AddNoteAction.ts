import { Action } from "./Action.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { useBearStore } from "../../state/useBearStore.ts";

export class AddNoteAction extends Action<NodesActionParams> {
  public static shared: AddNoteAction = new AddNoteAction();

  protected action(input: NodesActionParams): void {
    useBearStore
      .getState()
      .room.panels.notes.addNoteModal.showForCreate(input.nodes);
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length === 0 || !input.isLoggedIn;
  }

  icon(): string | null {
    return "sticky";
  }

  slug(): string {
    return "add-note";
  }

  title(): string {
    return "Add Note";
  }
}
