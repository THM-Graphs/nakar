import { Action, ActionShortcut } from "./Action.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { NodeDto } from "../../../src-gen";
import { createAppShortcut } from "./createAppShortcut.ts";

export class SelectAllNodesOfLabel extends Action<LabelActionParams> {
  public static shared: SelectAllNodesOfLabel = new SelectAllNodesOfLabel();

  protected action(input: LabelActionParams): Promise<void> | void {
    const nodes = useBearStore.getState().room.scenario.graph.elements.nodes;
    const nodesOfLabel = nodes.filter((n) =>
      this._nodeLabelsIncludeLabels(n, input.labels),
    );
    const setElements =
      useBearStore.getState().room.panels.inspector.setElements;

    setElements(nodesOfLabel.map((n) => n.id));
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

  private _nodeLabelsIncludeLabels(node: NodeDto, labels: string[]): boolean {
    for (const nodeLabel of node.labels) {
      for (const label of labels) {
        if (label === nodeLabel) {
          return true;
        }
      }
    }
    return false;
  }
}
