import { Action } from "./Action.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { match } from "ts-pattern";
import { actionControllerCompressNodes } from "../../../src-gen-2";

export class CompressLabelsAction extends Action<LabelActionParams> {
  public static shared: CompressLabelsAction = new CompressLabelsAction();

  protected async action(input: LabelActionParams): Promise<void> {
    if (input.labels.length !== 1) {
      // TODO: Allow
      throw new Error("Unable to compress multiple labels.");
    }
    const label = input.labels[0];
    resultOrThrow(
      await actionControllerCompressNodes({
        path: {
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          label: label,
        },
      }),
    );
  }

  disabled(input: LabelActionParams): boolean {
    return input.labels.length !== 1;
  }

  icon(): string | null {
    return "arrows-collapse";
  }

  slug(): string {
    return "compress-label";
  }

  title(input: LabelActionParams): string {
    return match(input.labels.length)
      .with(0, () => "Compress Labels")
      .with(1, () => "Compress Label")
      .otherwise((l) => `Compress ${l.toString()} Labels`);
  }
}
