import { Action } from "./Action.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";
import { postRoomActionRedo } from "../../src-gen";

export type RedoActionParams = {
  roomContext: RoomContext;
  redoAction: string | null;
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
    return !input.redoAction;
  }

  icon(): string {
    return "arrow-right";
  }

  slug(): string {
    return "redo";
  }

  title(params: RedoActionParams): string {
    if (params.redoAction == null) {
      return "Redo";
    } else {
      return `Redo '${params.redoAction}'`;
    }
  }
}
