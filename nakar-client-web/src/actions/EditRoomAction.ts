import { Action } from "./Action.ts";
import { RoomContext } from "../pages/Room.tsx";

export type EditRoomActionParams = { roomContext: RoomContext };

export class EditRoomAction extends Action<EditRoomActionParams> {
  public static shared: EditRoomAction = new EditRoomAction();

  protected action(input: EditRoomActionParams): void {
    if (input.roomContext.initialRoomData.editUrl != null) {
      window.open(input.roomContext.initialRoomData.editUrl, "_blank");
    }
  }

  disabled(input: EditRoomActionParams): boolean {
    return input.roomContext.initialRoomData.editUrl == null;
  }

  icon(): string | null {
    return "pen";
  }

  slug(): string {
    return "edit-room";
  }

  title(): string {
    return "Edit Room";
  }
}
