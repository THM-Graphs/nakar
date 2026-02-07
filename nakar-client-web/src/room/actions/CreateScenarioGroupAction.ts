import { Action } from "./Action.ts";
import { CanvasContextData } from "../../pages/Canvas.tsx";

export type CreateScenarioGroupActionParams = {
  roomContext: CanvasContextData;
};

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
