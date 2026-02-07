import { ScenarioCard } from "./ScenarioCard.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCallback } from "react";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { ScenarioTitleAndBadges } from "./ScenarioTitleAndBadges.tsx";
import {
  actionControllerLoadScenario,
  ScenarioArgumentDto,
  ScenarioDto,
  ScenarioGroupDto,
} from "../../../src-gen";

export function ScenarioDisplay(props: {
  scenarioGroup: ScenarioGroupDto;
  scenario: ScenarioDto;
  hidden?: boolean;
}) {
  const roomContext = useCanvasContext();
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const runScenario = useCallback(
    (additive: boolean, sceanriosArguments: ScenarioArgumentDto[]) => {
      if (props.scenario.parameters.length > 0) {
        showRunScenarioModal(props.scenario, sceanriosArguments, additive);
      } else {
        (async () => {
          try {
            await resultOrThrow(
              await actionControllerLoadScenario({
                path: {
                  roomId: roomContext.initialRoomData.id,
                  canvasId: roomContext.initialCanvasData.id,
                },
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
        scenarioGroup={props.scenarioGroup}
        onScenarioSelected={(scenario, additive) => {
          runScenario(additive, []);
        }}
        scenario={props.scenario}
      ></ScenarioCard>
    </Collapsable>
  );
}
