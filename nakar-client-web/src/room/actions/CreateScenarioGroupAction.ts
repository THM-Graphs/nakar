import { Action } from "./Action.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";

export type CreateScenarioGroupActionParams = { roomContext: CanvasContext };

export class CreateScenarioGroupAction extends Action<CreateScenarioGroupActionParams> {
  public static shared: CreateScenarioGroupAction =
    new CreateScenarioGroupAction();

  protected action(): Promise<void> | void {
    // TODO: Put create url in room data
  }

  disabled(): boolean {
    return true;
  }

  icon(): string {
    return "plus-lg";
  }

  slug(): string {
    return "create-scenario-group";
  }

  title(): string {
    return "New Scenario Group";
  }
}
