import { Scenario, ScenarioGroup, ScenarioGroups } from "../../../src-gen";
import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";
import { Stack } from "react-bootstrap";

export function ScenarioGroupList(props: {
  scenarioGroups: ScenarioGroups;
  onScenarioSelect: (scenario: Scenario) => void;
  hidden: boolean;
  scenarioLoading: string | null;
}) {
  return (
    <Stack className={"flex-grow-0"}>
      {props.scenarioGroups.scenarioGroups.length == 0 && (
        <span hidden={props.hidden} className={"small text-muted ms-1"}>
          (empty)
        </span>
      )}
      {props.scenarioGroups.scenarioGroups.map(
        (scenarioGroup: ScenarioGroup) => (
          <ScenarioGroupDisplay
            hidden={props.hidden}
            onScenarioSelect={props.onScenarioSelect}
            key={scenarioGroup.id}
            scenarioGroup={scenarioGroup}
            scenarioLoading={props.scenarioLoading}
          ></ScenarioGroupDisplay>
        ),
      )}
    </Stack>
  );
}
