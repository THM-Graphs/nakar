import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { RelationshipsActionParams } from "./RelationshipsActionParams.ts";
import { actionControllerDeleteElements } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export class RemoveRelationshipsAction extends Action<RelationshipsActionParams> {
  public static shared: RemoveRelationshipsAction =
    new RemoveRelationshipsAction();

  protected async action(input: RelationshipsActionParams): Promise<void> {
    await resultOrThrow(
      await actionControllerDeleteElements({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
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
    return "trash";
  }

  slug(): string {
    return "remove-edges";
  }

  title(): string {
    return "Remove Relationship";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("Backspace");
  }
}
