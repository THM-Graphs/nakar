import { Node, postRoomActionDeleteElements } from "../../src-gen";
import { Action } from "./Action.ts";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { RoomContext } from "../pages/Room.tsx";
import { match } from "ts-pattern";

export type RemoveNodesActionParams = {
  nodes: Node[];
  roomContext: RoomContext;
};

export class RemoveNodesAction extends Action<RemoveNodesActionParams> {
  public static shared: RemoveNodesAction = new RemoveNodesAction();

  protected async action(input: RemoveNodesActionParams): Promise<void> {
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

  disabled(input: RemoveNodesActionParams): boolean {
    return input.nodes.length === 0;
  }

  icon(): string | null {
    return "eye-slash";
  }

  slug(): string {
    return "remove-nodes";
  }

  title(input: RemoveNodesActionParams): string {
    return match(input.nodes.length)
      .with(0, () => "Remove Nodes")
      .with(1, () => "Remove Node")
      .otherwise((l) => `Remove ${l.toString()} Nodes`);
  }
}
