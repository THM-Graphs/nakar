import { Action } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import {
  actionControllerFlipCanvas,
  FlipCanvasRequestBodyDto,
} from "../../../src-gen";

export type FlipCanvasActionParams = {
  axis: FlipCanvasRequestBodyDto["axis"];
  nodeCount: number;
  roomContext: CanvasContextData;
  selectedTab: SelectedCanvasTab;
};

export class FlipCanvasAction extends Action<FlipCanvasActionParams> {
  public static shared: FlipCanvasAction = new FlipCanvasAction();

  protected async action(input: FlipCanvasActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerFlipCanvas({
        path: {
          roomId: input.roomContext.initialRoomData.id,
          canvasId: input.roomContext.initialCanvasData.id,
        },
        body: {
          axis: input.axis,
        },
      }),
    );
  }

  disabled(input: FlipCanvasActionParams): boolean {
    return input.nodeCount === 0 || input.selectedTab !== "graph";
  }

  icon(input: FlipCanvasActionParams): string | null {
    return input.axis === "x" ? "symmetry-horizontal" : "symmetry-vertical";
  }

  slug(): string {
    return "flip-canvas";
  }

  title(input: FlipCanvasActionParams): string {
    return input.axis === "x" ? "Flip Horizontal" : "Flip Vertical";
  }
}
