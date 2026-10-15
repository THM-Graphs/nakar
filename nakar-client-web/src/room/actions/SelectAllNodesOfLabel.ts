import { Action, ActionShortcut } from "./Action.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { createAppShortcut } from "./createAppShortcut.ts";

export class SelectAllNodesOfLabel extends Action<LabelActionParams> {
  public static shared: SelectAllNodesOfLabel = new SelectAllNodesOfLabel();

  protected action(input: LabelActionParams): Promise<void> | void {
    const nodeLabels =
      useBearStore.getState().room.scenario.graph.histogram.nodeLabels;
    const setElements =
      useBearStore.getState().room.panels.inspector.setElements;

    setElements([
      ...new Set(
        nodeLabels
          .filter((entry) => input.labels.includes(entry.value))
          .flatMap((entry) => entry.elementIds),
      ),
    ]);
  }

  disabled(): boolean {
    return false;
  }

  icon(): string | null {
    return "crosshair";
  }

  slug(): string {
    return "select-all-nodes-of-label";
  }

  title(): string {
    return `Select All Nodes`;
  }

  shortcut(): ActionShortcut | null {
    return createAppShortcut("$mod+Alt+KeyA");
  }
}
