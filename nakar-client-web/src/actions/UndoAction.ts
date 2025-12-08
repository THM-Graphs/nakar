import { Action } from "./Action.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";
import { postRoomActionUndo } from "../../src-gen";

export type UndoActionParams = {
  roomContext: RoomContext;
  undoAction: string | null;
};

export class UndoAction extends Action<UndoActionParams> {
  public static shared: UndoAction = new UndoAction();

  protected async action(input: UndoActionParams): Promise<void> {
    resultOrThrow(
      await postRoomActionUndo({
        path: {
          id: input.roomContext.initialRoomData.id,
        },
      }),
    );
  }

  disabled(input: UndoActionParams): boolean {
    return !input.undoAction;
  }

  icon(): string {
    return "arrow-left";
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
