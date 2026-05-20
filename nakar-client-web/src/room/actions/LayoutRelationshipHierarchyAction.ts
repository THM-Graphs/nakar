import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { RelationshipTypeActionParams } from "./RelationshipTypeActionParams.ts";
import { actionControllerLayout } from "../../../src-gen";

export class LayoutRelationshipHierarchyAction extends Action<RelationshipTypeActionParams> {
  public static shared: LayoutRelationshipHierarchyAction =
    new LayoutRelationshipHierarchyAction();

  protected async action(input: RelationshipTypeActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerLayout({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          layoutSpecification: {
            type: "LayoutSpecificationHierarchyDto",
            edgeType: input.relationshipTypes[0],
          },
        },
      }),
    );
  }

  disabled(input: RelationshipTypeActionParams): boolean {
    return input.relationshipTypes.length !== 1;
  }

  icon(): string | null {
    return "diagram-3";
  }

  slug(): string {
    return "layout-hierarchy";
  }

  title(): string {
    return "Layout as hierarchy";
  }
}
