import { Action } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { postRoomActionLayoutLabel } from "../../src-gen";
import { match } from "ts-pattern";

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
      await postRoomActionLayoutLabel({
        path: {
          id: input.roomContext.initialRoomData.id,
        },
        body: {
          label: label,
          layoutSpecification: {
            type: "LayoutSpecificationForceDirected",
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

  title(input: LabelActionParams): string {
    return match(input.labels.length)
      .with(0, () => "Layout Labels Force Directed")
      .with(1, () => "Layout Label Force Directed")
      .otherwise((l) => `Layout ${l.toString()} Labels Force Directed`);
  }
}
