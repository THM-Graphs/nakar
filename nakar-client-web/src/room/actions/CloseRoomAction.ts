import { Action } from "./Action.ts";
import { NavigateFunction } from "react-router";
import { Router } from "../../routing/Router.ts";

export type CloseRoomActionParams = { navigate: NavigateFunction };
export class CloseRoomAction extends Action<CloseRoomActionParams> {
  public static shared: CloseRoomAction = new CloseRoomAction();

  protected async action(params: CloseRoomActionParams): Promise<void> {
    await params.navigate(Router.getHomePath());
  }

  disabled(): boolean {
    return false;
  }

  icon(): string {
    return "chevron-left";
  }

  slug(): string {
    return "close-room";
  }

  title(): string {
    return "Close Room";
  }
}
