import { postRoomActionDeleteElements } from "../../../src-gen";
import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { match } from "ts-pattern";
import { NodesActionParams } from "./NodesActionParams.ts";

export class RemoveNodesAction extends Action<NodesActionParams> {
  public static shared: RemoveNodesAction = new RemoveNodesAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await postRoomActionDeleteElements({
        path: {
          id: input.roomContext.initialRoomData.id,
        },
        body: {
          nodes: input.nodes.map((n) => n.id),
          labels: [],
          edges: [],
          edgeTypes: [],
        },
      }),
    );
  }

  disabled(input: NodesActionParams): boolean {
    return input.nodes.length === 0;
  }

  icon(): string | null {
    return "eye-slash";
  }

  slug(): string {
    return "remove-nodes";
  }

  title(input: NodesActionParams): string {
    return match(input.nodes.length)
      .with(0, () => "Remove Nodes")
      .with(1, () => "Remove Node")
      .otherwise((l) => `Remove ${l.toString()} Nodes`);
  }
}
