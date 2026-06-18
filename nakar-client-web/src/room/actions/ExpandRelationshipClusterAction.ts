import { Action, ActionShortcut } from "./Action.ts";
import { RelationshipsActionParams } from "./RelationshipsActionParams.ts";
import { actionControllerExpandRelationshipCluster } from "api-client";

export class ExpandRelationshipClusterAction extends Action<RelationshipsActionParams> {
  public static shared: ExpandRelationshipClusterAction =
    new ExpandRelationshipClusterAction();

  protected async action(input: RelationshipsActionParams): Promise<void> {
    await actionControllerExpandRelationshipCluster({
      path: {
        roomId: input.roomContext.initialRoomData.id,
        canvasId: input.roomContext.initialCanvasData.id,
      },
      body: {
        edgeIds: input.edges.map((edge) => edge.id),
      },
    });
  }

  disabled(input: RelationshipsActionParams): boolean {
    return input.edges.length === 0 || !input.edges.every((e) => e.isCluster);
  }

  icon(): string | null {
    return "plus-lg";
  }

  slug(): string {
    return "expand-relationship-cluster";
  }

  title(): string {
    return "Expand Relationship Cluster";
  }

  shortcut(): ActionShortcut | null {
    return null;
  }
}
