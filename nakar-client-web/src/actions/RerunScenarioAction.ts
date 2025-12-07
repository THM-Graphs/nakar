import { Action } from "./Action.ts";
import { RoomContext } from "../pages/Room.tsx";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { postRoomActionReloadScenario, Scenario } from "../../src-gen";

export type RerunScenarioActionParams = {
  roomContext: RoomContext;
  scenario: Scenario | null;
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
