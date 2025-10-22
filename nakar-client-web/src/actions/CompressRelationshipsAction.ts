import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { postRoomActionCompressRelationships, Scenario } from "../../src-gen";
import { RoomContext } from "../pages/Room.tsx";

export type CompressRelationshipsActionParams = {
  uiLocked: boolean;
  selectedTab: SelectedCanvasTab;
  roomContext: RoomContext;
  scenario: Scenario | null;
};

export class CompressRelationshipsAction extends Action<CompressRelationshipsActionParams> {
  public static shared: CompressRelationshipsAction =
    new CompressRelationshipsAction();

  protected async action(
    input: CompressRelationshipsActionParams,
  ): Promise<void> {
    resultOrThrow(
      await postRoomActionCompressRelationships({
        path: { id: input.roomContext.initialRoomData.id },
      }),
    );
  }

  disabled(input: CompressRelationshipsActionParams): boolean {
    return (
      input.uiLocked || input.selectedTab !== "graph" || input.scenario == null
    );
  }

  icon(): string | null {
    return "arrows-collapse";
  }

  slug(): string {
    return "compress-relationships";
  }

  title(): string {
    return "Compress Relationships";
  }
}
