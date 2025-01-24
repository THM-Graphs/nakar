import { Scenario, ScenarioGroup, ScenarioGroups } from "../../../src-gen";
import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";

export function ScenarioGroupList(props: {
  scenarioGroups: ScenarioGroups;
  onScenarioSelect: (scenario: Scenario) => void;
  hidden: boolean;
  scenarioLoading: string | null;
}) {
  return (
    <ul>
      {props.scenarioGroups.scenarioGroups.length == 0 && (
        <span hidden={props.hidden}>(empty)</span>
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
    </ul>
  );
}
