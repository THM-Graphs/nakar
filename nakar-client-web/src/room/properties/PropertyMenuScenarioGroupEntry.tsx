import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { ScenarioTitleAndBadges } from "../scenarios-panel/ScenarioTitleAndBadges.tsx";
import { ScenarioGroupDto } from "../../../src-gen-2";

export function PropertyMenuScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroupDto;
  roomContext: CanvasContext;
  value: unknown;
}) {
  const scenarioGroup = props.scenarioGroup;

  const showRunScenarioModal = useBearStore(
    (s) => s.room.scenario.runScenarioModal.open,
  );

  return (
    <>
      {scenarioGroup.scenarios.map((scenario) => {
        return (
          <Dropdown.Item key={scenario.id}>
            <Stack
              gap={0}
              direction={"vertical"}
              className={"justify-content-between"}
            >
              <span className={"small text-muted"}>{scenarioGroup.title}</span>
              <ScenarioTitleAndBadges
                scenario={scenario}
                arguments={[
                  {
                    identifier: scenario.parameters[0].identifier,
                    value: JSON.stringify(props.value),
                  },
                ]}
                onRun={(additive, scenarioArguments) => {
                  showRunScenarioModal(scenario, scenarioArguments, additive);
                }}
              ></ScenarioTitleAndBadges>
            </Stack>
          </Dropdown.Item>
        );
      })}
    </>
  );
}
