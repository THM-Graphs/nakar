import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { NodesActionParams } from "./NodesActionParams.ts";
import { postCanvasActionShowShortestPath } from "../../../src-gen";

export class ShowShortestPathAction extends Action<NodesActionParams> {
  public static shared: ShowShortestPathAction = new ShowShortestPathAction();

  protected async action(input: NodesActionParams): Promise<void> {
    await resultOrThrow(
      await postCanvasActionShowShortestPath({
        path: { id: input.roomContext.initialCanvasData.id },
        body: {
          nodeIds: input.nodes.map((n) => n.id),
        },
      }),
    );
  }

  disabled(input: NodesActionParams): boolean {
    if (input.nodes.length < 2) {
      return true;
    }
    return false;
  }

  icon(): string | null {
    return "sign-turn-slight-right";
  }

  slug(): string {
    return "shortest-path";
  }

  title(): string {
    return "Show Shortest Path";
  }
}
