import { postRoomActionLoadScenario, Scenario } from "../../../src-gen";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCallback } from "react";
import { AppContext } from "../../state/AppContext.ts";
import { RoomContext } from "../../pages/Room.tsx";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { ScenarioTitleAndBadges } from "./ScenarioTitleAndBadges.tsx";

export function ScenarioDisplay(props: {
  scenario: Scenario;
  hidden?: boolean;
  context: AppContext;
  roomContext: RoomContext;
}) {
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const runScenario = useCallback(() => {
    if (props.scenario.parameters.length > 0) {
      showRunScenarioModal(props.scenario, null);
    } else {
      (async () => {
        try {
          await resultOrThrow(
            await postRoomActionLoadScenario({
              path: { id: props.roomContext.initialRoomData.id },
              body: {
                scenarioId: props.scenario.id,
                arguments: [],
              },
            }),
          );
        } catch (error) {
          pushErrorNotification(error);
        }
      })().catch(pushErrorNotification);
    }
  }, [props.scenario]);

  return (
    <Collapsable
      inset={0}
      sticky={false}
      title={
        <ScenarioTitleAndBadges
          scenario={props.scenario}
          onRun={(event) => {
            event.stopPropagation();
            runScenario();
          }}
        ></ScenarioTitleAndBadges>
      }
    >
      <ScenarioCard
        onScenarioSelected={runScenario}
        scenario={props.scenario}
      ></ScenarioCard>
    </Collapsable>
  );
}
