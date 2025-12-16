import { Action } from "./Action.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";

export type CreateScenarioActionParams = { roomContext: CanvasContext };

export class CreateScenarioAction extends Action<CreateScenarioActionParams> {
  public static shared: CreateScenarioAction = new CreateScenarioAction();

  protected action(): Promise<void> | void {
    // TODO put create url for scenarios in room data
  }

  disabled(): boolean {
    // TODO
    return true;
  }

  icon(): string {
    return "plus-lg";
  }

  slug(): string {
    return "create-scenario";
  }

  title(): string {
    return "New Scenario";
  }
}
