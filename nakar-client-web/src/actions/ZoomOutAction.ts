import { Node } from "../../src-gen";
import { BehaviorSubject } from "rxjs";
import { Action } from "./Action.ts";
import { SelectedCanvasTab } from "../state/SelectedCanvasTab.ts";

export type ZoomOutActionParams = {
  nodes: Node[];
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
