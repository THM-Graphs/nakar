import {
  GetScenario,
  GetScenarioGroup,
  GetScenarioGroups,
} from "../../../src-gen";
import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";

export function ScenarioGroupList(props: {
  scenarioGroups: GetScenarioGroups;
  onScenarioSelect: (scenario: GetScenario) => void;
  collapsed: boolean;
}) {
  return (
    <ul>
      {props.scenarioGroups.scenarioGroups.length == 0 && (
        <span hidden={props.collapsed}>(empty)</span>
      )}
      {props.scenarioGroups.scenarioGroups.map(
        (scenarioGroup: GetScenarioGroup) => (
          <ScenarioGroupDisplay
            collapsed={props.collapsed}
            onScenarioSelect={props.onScenarioSelect}
            key={scenarioGroup.id}
            scenarioGroup={scenarioGroup}
          ></ScenarioGroupDisplay>
        ),
      )}
    </ul>
  );
}
