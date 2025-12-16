import { postCanvasActionDeleteElements } from "../../../src-gen";
import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { match } from "ts-pattern";
import { RelationshipsActionParams } from "./RelationshipsActionParams.ts";

export class RemoveRelationshipsAction extends Action<RelationshipsActionParams> {
  public static shared: RemoveRelationshipsAction =
    new RemoveRelationshipsAction();

  protected async action(input: RelationshipsActionParams): Promise<void> {
    await resultOrThrow(
      await postCanvasActionDeleteElements({
        path: {
          id: input.roomContext.initialCanvasData.id,
        },
        body: {
          nodes: [],
          labels: [],
          edges: input.edges.map((n) => n.id),
          edgeTypes: [],
        },
      }),
    );
  }

  disabled(input: RelationshipsActionParams): boolean {
    return input.edges.length === 0;
  }

  icon(): string | null {
    return "eye-slash";
  }

  slug(): string {
    return "remove-edges";
  }

  title(input: RelationshipsActionParams): string {
    return match(input.edges.length)
      .with(0, () => "Remove Relationships")
      .with(1, () => "Remove Relationship")
      .otherwise((l) => `Remove ${l.toString()} Relationships`);
  }
}
