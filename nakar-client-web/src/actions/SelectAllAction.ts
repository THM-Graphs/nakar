import { Action } from "./Action.ts";
import { GraphElements } from "../../src-gen";
import { SelectedCanvasTab } from "../lib/state/SelectedCanvasTab.ts";

export type SelectAllActionParams = {
  graphElements: GraphElements;
  setElements: (ids: string[]) => void;
  selectedTab: SelectedCanvasTab;
};

export class SelectAllAction extends Action<SelectAllActionParams> {
  public static shared: SelectAllAction = new SelectAllAction();

  protected action(input: SelectAllActionParams): Promise<void> | void {
    const allIds = input.graphElements.nodes.map((n) => n.id);
    input.setElements(allIds);
  }

  disabled(input: SelectAllActionParams): boolean {
    return (
      input.graphElements.nodes.length === 0 || input.selectedTab !== "graph"
    );
  }

  icon(): string | null {
    return null;
  }

  slug(): string {
    return "select-all";
  }

  title(): string {
    return "Select All";
  }
}
