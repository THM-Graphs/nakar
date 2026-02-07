import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerUnlockNodes } from "../../../src-gen";

export class UnlockNodesAction extends Action<NodesActionParams> {
  public static shared: UnlockNodesAction = new UnlockNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerUnlockNodes({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          nodes: input.nodes.map((n) => n.id),
        },
      }),
    );
  }

  disabled(input: NodesActionParams): boolean {
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

  title(): string {
    return "Unlock Node";
  }
}
