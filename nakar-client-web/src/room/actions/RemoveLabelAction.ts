import { Action } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerDeleteElements } from "../../../src-gen";

export class RemoveLabelAction extends Action<LabelActionParams> {
  public static shared: RemoveLabelAction = new RemoveLabelAction();

  protected async action(input: LabelActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerDeleteElements({
        path: {
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          nodes: [],
          labels: input.labels,
          edges: [],
          edgeTypes: [],
        },
      }),
    );
  }

  disabled(input: LabelActionParams): boolean {
    return input.labels.length === 0;
  }

  icon(): string | null {
    return "eye-slash";
  }

  slug(): string {
    return "remove-label";
  }

  title(): string {
    return "Remove Label";
  }
}
