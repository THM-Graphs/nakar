import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import {
  postCanvasActionCompressRelationships,
  Scenario,
} from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";

export type CompressRelationshipsActionParams = {
  selectedTab: SelectedCanvasTab;
  roomContext: CanvasContext;
  scenario: Scenario | null;
};

export class CompressRelationshipsAction extends Action<CompressRelationshipsActionParams> {
  public static shared: CompressRelationshipsAction =
    new CompressRelationshipsAction();

  protected async action(
    input: CompressRelationshipsActionParams,
  ): Promise<void> {
    resultOrThrow(
      await postCanvasActionCompressRelationships({
        path: { id: input.roomContext.initialCanvasData.id },
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
