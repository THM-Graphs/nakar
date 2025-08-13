import { Action } from "./Action.ts";
import { Scenario } from "../../src-gen";

export type EditScenarioActionParams = {
  scenario: Scenario | null;
};

export class EditScenarioAction extends Action<EditScenarioActionParams> {
  public static shared: EditScenarioAction = new EditScenarioAction();

  protected action(input: EditScenarioActionParams): void {
    if (input.scenario?.editUrl != null) {
      window.open(input.scenario.editUrl, "_blank");
    }
  }

  disabled(input: EditScenarioActionParams): boolean {
    return input.scenario?.editUrl == null;
  }

  icon(): string | null {
    return "pen";
  }

  slug(): string {
    return "edit-scenario";
  }

  title(): string {
    return "Edit Scenario";
  }
}
