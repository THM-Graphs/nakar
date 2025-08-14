import { postRoomActionFocusNodes } from "../../src-gen";
import { Action } from "./Action.ts";
import { match } from "ts-pattern";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";

export class FocusNodesAction extends Action<NodesActionParams> {
  public static shared: FocusNodesAction = new FocusNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await postRoomActionFocusNodes({
        path: {
          id: input.roomContext.initialRoomData.id,
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
