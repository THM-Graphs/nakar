import { Action } from "./Action.ts";
import { match } from "ts-pattern";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerUnlockNodes } from "../../../src-gen-2";

export class UnlockNodesAction extends Action<NodesActionParams> {
  public static shared: UnlockNodesAction = new UnlockNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerUnlockNodes({
        path: { canvasId: input.roomContext.initialCanvasData.id },
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

  title(input: NodesActionParams): string {
    return match(input.nodes.length)
      .with(0, () => "Unlock Nodes")
      .with(1, () => "Unlock Node")
      .otherwise((l) => `Unlock ${l.toString()} Nodes`);
  }
}
