import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { RelationshipTypeActionParams } from "./RelationshipTypeActionParams.ts";
import { actionControllerFocusRelationshipType } from "../../../src-gen";

export class FocusRelationshipTypeAction extends Action<RelationshipTypeActionParams> {
  public static shared: FocusRelationshipTypeAction =
    new FocusRelationshipTypeAction();

  protected async action(input: RelationshipTypeActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerFocusRelationshipType({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          relationshipTypes: input.relationshipTypes,
        },
      }),
    );
  }

  disabled(input: RelationshipTypeActionParams): boolean {
    return input.relationshipTypes.length === 0;
  }

  icon(): string | null {
    return "binoculars";
  }

  slug(): string {
    return "focus-relationship-type";
  }

  title(): string {
    return "Focus Relationship Types";
  }
}
