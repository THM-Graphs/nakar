import { Action } from "./Action.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";
import { postRoomActionRedo } from "../../src-gen";

export type RedoActionParams = {
  roomContext: RoomContext;
  canRedo: boolean;
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
    return !input.canRedo;
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
