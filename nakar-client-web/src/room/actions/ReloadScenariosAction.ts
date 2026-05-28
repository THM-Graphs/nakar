import { Action } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { CanvasPageDto, publicCanvasControllerGetCanvas } from "api-client";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useBearStore } from "../../state/useBearStore.ts";

export type ReloadScenariosActionParams = {
  roomContext: CanvasContextData;
};

export class ReloadScenariosAction extends Action<ReloadScenariosActionParams> {
  public static shared: ReloadScenariosAction = new ReloadScenariosAction();

  protected async action(props: ReloadScenariosActionParams): Promise<void> {
    const data: CanvasPageDto = resultOrThrow(
      await publicCanvasControllerGetCanvas({
        path: {
          canvasId: props.roomContext.initialCanvasData.id,
          roomId: props.roomContext.initialRoomData.id,
        },
      }),
    );
    useBearStore.getState().room.panels.scenarios.setScenarios(data.scenarios);
  }

  disabled(): boolean {
    return false;
  }

  icon(): string | null {
    return "arrow-clockwise";
  }

  slug(): string {
    return "reload-scenarios";
  }

  title(): string {
    return "Reload Scenarios";
  }
}
