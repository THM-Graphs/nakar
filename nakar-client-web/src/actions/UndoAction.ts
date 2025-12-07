import { Action } from "./Action.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";
import { postRoomActionUndo } from "../../src-gen";

export type UndoActionParams = {
  roomContext: RoomContext;
  canUndo: boolean;
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
    return !input.canUndo;
  }

  icon(): string {
    return "arrow-left";
  }

  slug(): string {
    return "undo";
  }

  title(): string {
    return "Undo";
  }
}
