import { Action } from "./Action.ts";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";
import { postRoomActionRedo } from "../../src-gen";

export type RedoActionParams = {
  roomContext: RoomContext;
  canRedo: boolean;
  uiLocked: boolean;
};

export class RedoAction extends Action<RedoActionParams> {
  public static shared: RedoAction = new RedoAction();

  protected async action(input: RedoActionParams): Promise<void> {
    resultOrThrow(
      await postRoomActionRedo({
        path: {
          id: input.roomContext.initialRoomData.id,
        },
      }),
    );
  }

  disabled(input: RedoActionParams): boolean {
    return !input.canRedo || input.uiLocked;
  }

  icon(): string {
    return "arrow-right";
  }

  slug(): string {
    return "redo";
  }

  title(): string {
    return "Redo";
  }
}
