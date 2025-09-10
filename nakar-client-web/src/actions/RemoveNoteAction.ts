import { deleteNote } from "../../src-gen";
import { Action } from "./Action.ts";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";

export type RemoveNoteActionParams = {
  noteId: string;
  roomContext: RoomContext;
};
export class RemoveNoteAction extends Action<RemoveNoteActionParams> {
  public static shared: RemoveNoteAction = new RemoveNoteAction();

  protected async action(input: RemoveNoteActionParams): Promise<void> {
    await resultOrThrow(
      await deleteNote({
        path: {
          id: input.roomContext.initialRoomData.id,
          noteId: input.noteId,
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
