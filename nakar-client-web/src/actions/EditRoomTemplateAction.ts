import { Action } from "./Action.ts";
import { RoomContext } from "../pages/Room.tsx";

export type EditRoomTemplateActionParams = { roomContext: RoomContext };

export class EditRoomTemplateAction extends Action<EditRoomTemplateActionParams> {
  public static shared: EditRoomTemplateAction = new EditRoomTemplateAction();

  protected action(input: EditRoomTemplateActionParams): void {
    if (input.roomContext.initialRoomData.template?.editUrl != null) {
      window.open(input.roomContext.initialRoomData.template.editUrl, "_blank");
    }
  }

  disabled(input: EditRoomTemplateActionParams): boolean {
    return input.roomContext.initialRoomData.template?.editUrl == null;
  }

  icon(): string | null {
    return "pen";
  }

  slug(): string {
    return "edit-room-template";
  }

  title(): string {
    return "Edit Template";
  }
}
