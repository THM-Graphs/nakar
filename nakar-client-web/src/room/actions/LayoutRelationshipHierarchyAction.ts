import { Action } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { RelationshipsActionParams } from "./RelationshipsActionParams.ts";
import { actionControllerLayout } from "../../../src-gen";

export class LayoutRelationshipHierarchyAction extends Action<RelationshipsActionParams> {
  public static shared: LayoutRelationshipHierarchyAction =
    new LayoutRelationshipHierarchyAction();

  protected async action(input: RelationshipsActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerLayout({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          layoutSpecification: {
            type: "LayoutSpecificationHierarchyDto",
            edgeType: input.edges[0].type,
          },
        },
      }),
    );
  }

  disabled(input: RelationshipsActionParams): boolean {
    return input.edges.length !== 1;
  }

  icon(): string | null {
    return "diagram-3";
  }

  slug(): string {
    return "layout-hierarchy";
  }

  title(): string {
    return "Layout hierarchy";
  }
}
