import { Action, ActionShortcut } from "./Action.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { RelationshipsActionParams } from "./RelationshipsActionParams.ts";
import { actionControllerFocusRelationships } from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";

export class FocusRelationshipsAction extends Action<RelationshipsActionParams> {
  public static shared: FocusRelationshipsAction =
    new FocusRelationshipsAction();

  protected async action(input: RelationshipsActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerFocusRelationships({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: { edges: input.edges.map((edge) => edge.id) },
      }),
    );
  }

  disabled(input: RelationshipsActionParams): boolean {
    return input.edges.length === 0;
  }

  icon(): string | null {
    return "binoculars";
  }

  slug(): string {
    return "focus-relationships";
  }

  title(input: RelationshipsActionParams): string {
    return input.edges.length === 1
      ? "Focus Relationship"
      : "Focus Relationships";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+f");
  }
}
