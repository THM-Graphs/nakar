import { postCanvasActionLoadScenario, ScenarioGroup } from "../../../src-gen";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { ScenarioTitleAndBadges } from "../scenarios-panel/ScenarioTitleAndBadges.tsx";

export function PropertyMenuScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroup;
  roomContext: CanvasContext;
  value: unknown;
}) {
  const scenarioGroup = props.scenarioGroup;

  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

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
