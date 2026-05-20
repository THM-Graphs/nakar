import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { RelationshipTypeActionParams } from "./RelationshipTypeActionParams.ts";
import { actionControllerDeleteElements } from "../../../src-gen";

export class RemoveRelationshipsOfTypeAction extends Action<RelationshipTypeActionParams> {
  public static shared: RemoveRelationshipsOfTypeAction =
    new RemoveRelationshipsOfTypeAction();

  protected async action(input: RelationshipTypeActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerDeleteElements({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          nodes: [],
          labels: [],
          edges: [],
          edgeTypes: input.relationshipTypes,
        },
      }),
    );
  }

  disabled(input: RelationshipTypeActionParams): boolean {
    return input.relationshipTypes.length === 0;
  }

  icon(): string | null {
    return "trash";
  }

  slug(): string {
    return "remove-relationships-of-type";
  }

  title(input: RelationshipTypeActionParams): string {
    return input.relationshipTypes.length === 1
      ? "Remove Relationship Type"
      : "Remove Relationship Types";
  }
}
