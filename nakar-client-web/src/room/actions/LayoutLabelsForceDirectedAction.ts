import { Action } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerLayoutLabel } from "../../../src-gen";

export class LayoutLabelsForceDirectedAction extends Action<LabelActionParams> {
  public static shared: LayoutLabelsForceDirectedAction =
    new LayoutLabelsForceDirectedAction();

  protected async action(input: LabelActionParams): Promise<void> {
    if (input.labels.length !== 1) {
      // TODO: Allow
      throw new Error("Unable to layout multiple labels.");
    }
    const label = input.labels[0];
    resultOrThrow(
      await actionControllerLayoutLabel({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          label: label,
          layoutSpecification: {
            type: "LayoutSpecificationForceDirectedDto",
          },
        },
      }),
    );
  }

  disabled(input: LabelActionParams): boolean {
    return input.labels.length !== 1;
  }

  icon(): string | null {
    return "tropical-storm";
  }

  slug(): string {
    return "layout-labels-force-directed";
  }

  title(): string {
    return "Layout Label Force Directed";
  }
}
