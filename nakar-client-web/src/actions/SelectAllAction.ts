import { Action } from "./Action.ts";
import { GraphElements } from "../../src-gen";

export type SelectAllActionParams = {
  graphElements: GraphElements;
  setElements: (ids: string[]) => void;
};

export class SelectAllAction extends Action<SelectAllActionParams> {
  public static shared: SelectAllAction = new SelectAllAction();

  protected action(input: SelectAllActionParams): Promise<void> | void {
    const allIds = input.graphElements.nodes.map((n) => n.id);
    input.setElements(allIds);
  }

  disabled(input: SelectAllActionParams): boolean {
    return input.graphElements.nodes.length === 0;
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
