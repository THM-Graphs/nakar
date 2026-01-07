import {
  postCanvasActionLoadScenario,
  Scenario,
  ScenarioArgument,
} from "../../../src-gen";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCallback } from "react";
import { AppContext } from "../../state/AppContext.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { ScenarioTitleAndBadges } from "./ScenarioTitleAndBadges.tsx";

export function ScenarioDisplay(props: {
  scenario: Scenario;
  hidden?: boolean;
  context: AppContext;
  roomContext: CanvasContext;
}) {
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const runScenario = useCallback(
    (additive: boolean, sceanriosArguments: ScenarioArgument[]) => {
      if (props.scenario.parameters.length > 0) {
        showRunScenarioModal(props.scenario, sceanriosArguments, additive);
      } else {
        (async () => {
          try {
            await resultOrThrow(
              await postCanvasActionLoadScenario({
                path: { id: props.roomContext.initialCanvasData.id },
                body: {
                  scenarioId: props.scenario.id,
                  arguments: [],
                  additive: additive,
                },
              }),
            );
          } catch (error) {
            pushErrorNotification(error);
          }
        })().catch(pushErrorNotification);
      }
    },
    [props.scenario],
  );

  return (
    <Collapsable
      inset={0}
      sticky={false}
      title={
        <ScenarioTitleAndBadges
          scenario={props.scenario}
          onRun={(additive, sceanriosArguments) => {
            runScenario(additive, sceanriosArguments);
          }}
        ></ScenarioTitleAndBadges>
      }
    >
      <ScenarioCard
        onScenarioSelected={(scenario, additive) => {
          runScenario(additive, []);
        }}
        scenario={props.scenario}
      ></ScenarioCard>
    </Collapsable>
  );
}
