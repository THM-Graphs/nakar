import { BehaviorSubject } from "rxjs";
import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { NodeDto } from "../../../src-gen";

export type ZoomOutActionParams = {
  nodes: NodeDto[];
  onZoomOut: BehaviorSubject<void>;
  selectedTab: SelectedCanvasTab;
};

export class ZoomOutAction extends Action<ZoomOutActionParams> {
  public static shared: ZoomOutAction = new ZoomOutAction();

  protected action(input: ZoomOutActionParams): Promise<void> | void {
    input.onZoomOut.next();
  }

  disabled(input: ZoomOutActionParams): boolean {
    return input.nodes.length === 0 || input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "zoom-out";
  }

  slug(): string {
    return "zoom-out";
  }

  title(): string {
    return "Zoom Out";
  }
}
