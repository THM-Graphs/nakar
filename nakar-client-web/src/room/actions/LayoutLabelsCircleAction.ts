import { Action, ActionShortcut } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerLayout } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

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
      await actionControllerLayout({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          layoutSpecification: {
            type: "LayoutSpecificationCircleDto",
            radius: n,
            label: label,
          },
        },
      }),
    );
  }

  disabled(input: LabelActionParams): boolean {
    return input.labels.length !== 1;
  }

  icon(): string | null {
    return "circle";
  }

  slug(): string {
    return "layout-labels-circle";
  }

  title(): string {
    return "Layout Label Circle";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Alt+KeyC");
  }
}
