import { Action } from "./Action.ts";
import { RoomContext } from "../pages/Room.tsx";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { postRoomActionReloadScenario, Scenario } from "../../src-gen";

export type RerunScenarioActionParams = {
  roomContext: RoomContext;
  scenario: Scenario | null;
  uiLocked: boolean;
};

export class RerunScenarioAction extends Action<RerunScenarioActionParams> {
  public static shared: RerunScenarioAction = new RerunScenarioAction();

  protected async action(input: RerunScenarioActionParams): Promise<void> {
    resultOrThrow(
      await postRoomActionReloadScenario({
        path: { id: input.roomContext.initialRoomData.id },
      }),
    );
  }

  disabled(input: RerunScenarioActionParams): boolean {
    return input.scenario == null || input.uiLocked;
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
