import { Action } from "./Action.ts";
import { match } from "ts-pattern";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { actionControllerFocusNodes } from "../../../src-gen";

export class FocusNodesAction extends Action<NodesActionParams> {
  public static shared: FocusNodesAction = new FocusNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerFocusNodes({
        path: {
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: { nodes: input.nodes.map((n) => n.id) },
      }),
    );
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length === 0;
  }

  icon(): string | null {
    return "binoculars";
  }

  slug(): string {
    return "focus-nodes";
  }

  title(input: NodesActionParams): string {
    return match(input.nodes.length)
      .with(0, () => "Focus Nodes")
      .with(1, () => "Focus Node")
      .otherwise((l) => `Focus ${l.toString()} Nodes`);
  }
}
