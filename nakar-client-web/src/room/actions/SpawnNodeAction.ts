import { Action } from "./Action.ts";
import { postRoomActionLoadNode } from "../../../src-gen";
import { RoomContext } from "../../pages/Room.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useBearStore } from "../../state/useBearStore.ts";

export type SpawnNodeActionParams = {
  nodeId: string;
  databaseId: string;
  roomContext: RoomContext;
};
export class SpawnNodeAction extends Action<SpawnNodeActionParams> {
  public static shared: SpawnNodeAction = new SpawnNodeAction();

  protected async action(input: SpawnNodeActionParams): Promise<void> {
    resultOrThrow(
      await postRoomActionLoadNode({
        path: { id: input.roomContext.initialRoomData.id },
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
