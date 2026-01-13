import { Action } from "./Action.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { actionControllerReloadScenario, ScenarioDto } from "../../../src-gen";

export type RerunScenarioActionParams = {
  roomContext: CanvasContext;
  scenario: ScenarioDto | null;
};

export class RerunScenarioAction extends Action<RerunScenarioActionParams> {
  public static shared: RerunScenarioAction = new RerunScenarioAction();

  protected async action(input: RerunScenarioActionParams): Promise<void> {
    resultOrThrow(
      await actionControllerReloadScenario({
        path: { canvasId: input.roomContext.initialCanvasData.id },
      }),
    );
  }

  disabled(): boolean {
    return false;
  }

  icon(): string | null {
    return "arrow-clockwise";
  }

  slug(): string {
    return "rerun-scenario";
  }

  title(): string {
    return "Rerun Scenario";
  }
}
