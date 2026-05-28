import { Action } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { actionControllerLoadNode } from "api-client";

export type SpawnNodeActionParams = {
  nodeId: string;
  databaseId: string;
  roomContext: CanvasContextData;
};
export class SpawnNodeAction extends Action<SpawnNodeActionParams> {
  public static shared: SpawnNodeAction = new SpawnNodeAction();

  protected async action(input: SpawnNodeActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerLoadNode({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: { nodeId: input.nodeId, databaseId: input.databaseId },
      }),
    );
    useBearStore.getState().room.panels.inspector.setElement(input.nodeId);
  }

  disabled(): boolean {
    return false;
  }

  icon(): string | null {
    return "download";
  }

  slug(): string {
    return "spawn-node-action";
  }

  title(): string {
    return "Load Node";
  }
}
