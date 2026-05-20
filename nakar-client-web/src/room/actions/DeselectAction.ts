import { Action, ActionShortcut } from "./Action.ts";

export type DeselectActionParams = {
  elements: string[];
  deselectElements: () => void;
};

export class DeselectAction extends Action<DeselectActionParams> {
  public static shared: DeselectAction = new DeselectAction();

  protected action(input: DeselectActionParams): Promise<void> | void {
    input.deselectElements();
  }

  disabled(input: DeselectActionParams): boolean {
    return input.elements.length === 0;
  }

  icon(): string | null {
    return null;
  }

  slug(): string {
    return "deselect";
  }

  title(): string {
    return "Deselect";
  }

  shortcut(): ActionShortcut | null {
    return { keys: "Escape" };
  }
}
