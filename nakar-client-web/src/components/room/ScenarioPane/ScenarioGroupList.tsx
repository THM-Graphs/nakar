import { Scenario, ScenarioGroup, ScenarioGroups } from "../../../../src-gen";
import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";
import { Stack } from "react-bootstrap";

export function ScenarioGroupList(props: {
  scenarioGroups: ScenarioGroups;
  onScenarioSelect: (scenario: Scenario) => void;
  scenarioLoading: string | null;
}) {
  return (
    <Stack className={"flex-grow-0"}>
      {props.scenarioGroups.scenarioGroups.length == 0 && (
        <span
          className={"small text-muted ms-1 fst-italic align-self-center pb-1"}
        >
          empty
        </span>
      )}
      {props.scenarioGroups.scenarioGroups.map(
        (scenarioGroup: ScenarioGroup) => (
          <ScenarioGroupDisplay
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
