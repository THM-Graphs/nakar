import { Action } from "./Action.ts";
import { Node, postRoomActionUnlockNodes } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";
import { match } from "ts-pattern";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";

export type UnlockNodesActionParams = {
  nodes: Node[];
  roomContext: RoomContext;
};

export class UnlockNodesAction extends Action<UnlockNodesActionParams> {
  public static shared: UnlockNodesAction = new UnlockNodesAction();

  protected async action(input: UnlockNodesActionParams): Promise<void> {
    await resultOrThrow(
      await postRoomActionUnlockNodes({
        path: { id: input.roomContext.initialRoomData.id },
        body: {
          nodes: input.nodes.map((n) => n.id),
        },
      }),
    );
  }

  disabled(input: UnlockNodesActionParams): boolean {
    const oneOrMoreNodesAreUnlockable =
      input.nodes.find((n) => n.locked) != null;
    return !oneOrMoreNodesAreUnlockable;
  }

  icon(): string | null {
    return "unlock";
  }

  slug(): string {
    return "unlock-nodes";
  }

  title(input: UnlockNodesActionParams): string {
    return match(input.nodes.length)
      .with(0, () => "Unlock Nodes")
      .with(1, () => "Unlock Node")
      .otherwise((l) => `Unlock ${l.toString()} Nodes`);
  }
}
