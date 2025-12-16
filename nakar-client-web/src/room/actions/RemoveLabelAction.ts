import { Action } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { postCanvasActionDeleteElements } from "../../../src-gen";
import { match } from "ts-pattern";

export class RemoveLabelAction extends Action<LabelActionParams> {
  public static shared: RemoveLabelAction = new RemoveLabelAction();

  protected async action(input: LabelActionParams): Promise<void> {
    resultOrThrow(
      await postCanvasActionDeleteElements({
        path: {
          id: input.roomContext.initialCanvasData.id,
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

  title(input: LabelActionParams): string {
    return match(input.labels.length)
      .with(0, () => "Remove Labels")
      .with(1, () => "Remove Label")
      .otherwise((l) => `Remove ${l.toString()} Labels`);
  }
}
