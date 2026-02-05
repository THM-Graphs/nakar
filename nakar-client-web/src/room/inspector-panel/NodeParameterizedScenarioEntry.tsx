import { Dropdown, Stack } from "react-bootstrap";
import { ScenarioTitleAndBadges } from "../scenarios-panel/ScenarioTitleAndBadges.tsx";
import { NodeDto, ScenarioDto, ScenarioParameterDto } from "../../../src-gen";
import { useBearStore } from "../../state/useBearStore.ts";
import { convertToTargetTypeStringRepresentation } from "../../shared/data/convertToTargetTypeStringRepresentation.ts";

export function NodeParameterizedScenarioEntry(props: {
  scenario: ScenarioDto;
  node: NodeDto;
}) {
  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
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
            showRunScenarioModal(props.scenario, scenarioArguments, additive);
          }}
          hideParameters={true}
        ></ScenarioTitleAndBadges>
      </Stack>
    </Dropdown.ItemText>
  );
}
