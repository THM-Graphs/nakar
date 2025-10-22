import { Action } from "./Action.ts";
import { useBearStore } from "../state/useBearStore.ts";
import { LabelActionParams } from "./LabelActionParams.ts";
import { Node } from "../../src-gen";

export class SelectAllNodesOfLabel extends Action<LabelActionParams> {
  public static shared: SelectAllNodesOfLabel = new SelectAllNodesOfLabel();

  protected action(input: LabelActionParams): Promise<void> | void {
    const nodes = useBearStore.getState().room.scenario.graph.elements.nodes;
    const nodesOfLabel = nodes.filter((n) =>
      this._nodeLabelsIncludeLabels(n, input.labels),
    );
    const deselectElements =
      useBearStore.getState().room.panels.inspector.deselectElements;
    const appendElement =
      useBearStore.getState().room.panels.inspector.appendElement;

    deselectElements();
    for (const node of nodesOfLabel) {
      appendElement(node.id);
    }
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

  private _nodeLabelsIncludeLabels(node: Node, labels: string[]): boolean {
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
