import { Dropdown, Stack } from "react-bootstrap";
import { ScenarioTitleAndBadges } from "../scenarios-panel/ScenarioTitleAndBadges.tsx";
import {
  actionControllerLoadScenario,
  NodeDto,
  ScenarioArgumentDto,
  ScenarioDto,
  ScenarioParameterDto,
} from "../../../src-gen";
import { useBearStore } from "../../state/useBearStore.ts";
import { convertToTargetTypeStringRepresentation } from "../../shared/data/convertToTargetTypeStringRepresentation.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";

export function NodeParameterizedScenarioEntry(props: {
  scenario: ScenarioDto;
  node: NodeDto;
}) {
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );
  const roomContext = useCanvasContext();
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  if (props.scenario.parameters.length === 0) {
    return null;
  }
  const parameter: ScenarioParameterDto = props.scenario.parameters[0];

  // Evaluate the argument value for the run scenario modal window
  const argumentValue: string = convertToTargetTypeStringRepresentation(
    props.node.properties[parameter.identifier],
    parameter.dataType,
  );

  const handleRunOnSingleParameter = async (
    scenarioArguments: ScenarioArgumentDto[],
    additive: boolean,
  ) => {
    try {
      await resultOrThrow(
        await actionControllerLoadScenario({
          path: {
            roomId: roomContext.initialRoomData.id,
            canvasId: roomContext.initialCanvasData.id,
          },
          body: {
            scenarioId: props.scenario.id,
            arguments: scenarioArguments,
            additive: additive,
          },
        }),
      );
    } catch (error) {
      pushErrorNotification(error);
    }
  };

  return (
    <Dropdown.ItemText key={props.scenario.id}>
      <Stack
        gap={0}
        direction={"vertical"}
        className={"justify-content-between"}
      >
        <ScenarioTitleAndBadges
          scenario={props.scenario}
          arguments={[
            {
              identifier: parameter.identifier,
              value: argumentValue,
            },
          ]}
          onRun={(additive, scenarioArguments) => {
            if (props.scenario.parameters.length === 1) {
              void handleRunOnSingleParameter(scenarioArguments, additive);
            } else {
              showRunScenarioModal(props.scenario, scenarioArguments, additive);
            }
          }}
          hideParameters={false}
        ></ScenarioTitleAndBadges>
      </Stack>
    </Dropdown.ItemText>
  );
}
