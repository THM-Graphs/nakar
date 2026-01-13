import { BehaviorSubject } from "rxjs";
import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { NodeDto } from "../../../src-gen";

export type ZoomInActionParams = {
  nodes: NodeDto[];
  onZoomIn: BehaviorSubject<void>;
  selectedTab: SelectedCanvasTab;
};

export class ZoomInAction extends Action<ZoomInActionParams> {
  public static shared: ZoomInAction = new ZoomInAction();

  protected action(input: ZoomInActionParams): Promise<void> | void {
    input.onZoomIn.next();
  }

  disabled(input: ZoomInActionParams): boolean {
    return input.nodes.length === 0 || input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "zoom-in";
  }

  slug(): string {
    return "zoom-in";
  }

  title(): string {
    return "Zoom In";
  }
}
