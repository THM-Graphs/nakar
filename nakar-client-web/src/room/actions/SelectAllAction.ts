import { Action, ActionShortcut } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { LiveCanvasGraphElementsDto } from "api-client";
import { createAppShortcut } from "./createAppShortcut.ts";

export type SelectAllActionParams = {
  graphElements: LiveCanvasGraphElementsDto;
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

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+a");
  }
}
