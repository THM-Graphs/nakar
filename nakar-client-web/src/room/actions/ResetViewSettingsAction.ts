import { Action } from "./Action.ts";
import { actionControllerResetViewSettings } from "../../../src-gen";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";

export type ResetViewSettingsActionParams = {
  roomContext: CanvasContextData;
};

export class ResetViewSettingsAction extends Action<ResetViewSettingsActionParams> {
  public static shared: ResetViewSettingsAction = new ResetViewSettingsAction();

  protected async action(params: ResetViewSettingsActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerResetViewSettings({
        path: {
          roomId: params.roomContext.initialRoomData.id,
          canvasId: params.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  public disabled(): boolean {
    return false;
  }

  public icon(): string | null {
    return "eraser";
  }

  public slug(): string {
    return "reset-view-settings";
  }

  public title(): string {
    return "Reset Canvas Visualization Settings";
  }
}
