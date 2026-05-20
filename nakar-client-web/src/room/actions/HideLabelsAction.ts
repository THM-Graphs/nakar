import { Action, ActionShortcut } from "./Action.ts";
import { SelectedCanvasTab } from "../../state/SelectedCanvasTab.ts";
import { createAppShortcut } from "./createAppShortcut.ts";

export type HideLabelsActionParams = {
  selectedTab: SelectedCanvasTab;
  hideLabels: boolean;
  setHideLabels: (b: boolean) => void;
};

export class HideLabelsAction extends Action<HideLabelsActionParams> {
  public static shared: HideLabelsAction = new HideLabelsAction();

  protected action(input: HideLabelsActionParams): Promise<void> | void {
    input.setHideLabels(!input.hideLabels);
  }

  disabled(input: HideLabelsActionParams): boolean {
    return input.selectedTab !== "graph";
  }

  icon(): string | null {
    return "card-text";
  }

  slug(): string {
    return "hide-labels";
  }

  title(input: HideLabelsActionParams): string {
    return input.hideLabels ? "Show Labels" : "Hide Labels";
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Alt+KeyL");
  }
}
