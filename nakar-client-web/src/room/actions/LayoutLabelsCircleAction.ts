import { Action } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { postRoomActionLayoutLabel } from "../../../src-gen";
import { match } from "ts-pattern";

export class LayoutLabelsCircleAction extends Action<LabelActionParams> {
  public static shared: LayoutLabelsCircleAction =
    new LayoutLabelsCircleAction();

  protected async action(input: LabelActionParams): Promise<void> {
    if (input.labels.length !== 1) {
      // TODO: Allow
      throw new Error("Unable to layout multiple labels.");
    }
    const label = input.labels[0];
    const distanceString = prompt("Circle Radius (Pixels):", "3000");
    if (distanceString == null) {
      return;
    }
    const n = Number(distanceString);
    if (isNaN(n)) {
      throw new Error(`Unable to create a number from ${distanceString}`);
    }
    resultOrThrow(
      await postRoomActionLayoutLabel({
        path: {
          id: input.roomContext.initialRoomData.id,
        },
        body: {
          label: label,
          layoutSpecification: {
            type: "LayoutSpecificationCircle",
            radius: n,
          },
        },
      }),
    );
  }

  disabled(input: LabelActionParams): boolean {
    return input.labels.length !== 1;
  }

  icon(): string | null {
    return "1-circle";
  }

  slug(): string {
    return "layout-labels-circle";
  }

  title(input: LabelActionParams): string {
    return match(input.labels.length)
      .with(0, () => "Layout Labels Circle")
      .with(1, () => "Layout Label Circle")
      .otherwise((l) => `Layout ${l.toString()} Labels Circle`);
  }
}
