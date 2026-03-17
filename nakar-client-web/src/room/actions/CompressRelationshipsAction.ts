import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { actionControllerCompressRelationships } from "../../../src-gen";

export type CompressRelationshipsActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: CanvasContextData;
};

export class CompressRelationshipsAction extends Action<CompressRelationshipsActionParams> {
  public static shared: CompressRelationshipsAction =
    new CompressRelationshipsAction();

  protected async action(
    input: CompressRelationshipsActionParams,
  ): Promise<void> {
    resultOrThrow(
      await actionControllerCompressRelationships({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
      }),
    );
  }

  disabled(input: CompressRelationshipsActionParams): boolean {
    return input.selectedTab !== "graph";
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
