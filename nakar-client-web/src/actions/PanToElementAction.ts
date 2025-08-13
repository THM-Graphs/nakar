import { Action } from "./Action.ts";
import { BehaviorSubject } from "rxjs";

export type PanToElementActionParams = {
  onCenter: BehaviorSubject<void>;
  selectedElements: string[];
};

export class PanToElementAction extends Action<PanToElementActionParams> {
  public static shared: PanToElementAction = new PanToElementAction();

  protected action(input: PanToElementActionParams): Promise<void> | void {
    input.onCenter.next();
  }

  disabled(input: PanToElementActionParams): boolean {
    return input.selectedElements.length === 0;
  }

  icon(): string | null {
    return "crosshair";
  }

  slug(): string {
    return "pan-to-element";
  }

  title(): string {
    return "Pan To Element";
  }
}
