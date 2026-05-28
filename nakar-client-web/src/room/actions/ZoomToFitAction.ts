import { Action } from "./Action.ts";
import { BehaviorSubject } from "rxjs";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { NodeDto } from "api-client";

export type ZoomToFitActionParams = {
  onZoomOutOverview: BehaviorSubject<void>;
  nodes: NodeDto[];
  selectedTab: SelectedCanvasTab;
};

export class ZoomToFitAction extends Action<ZoomToFitActionParams> {
  public static shared: ZoomToFitAction = new ZoomToFitAction();

  protected action(input: ZoomToFitActionParams): Promise<void> | void {
    input.onZoomOutOverview.next();
  }

  disabled(input: ZoomToFitActionParams): boolean {
    return input.nodes.length === 0 || input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "aspect-ratio";
  }

  slug(): string {
    return "zoom-to-fit";
  }

  title(): string {
    return "Zoom To Fit";
  }
}
