import {
  GetScenario,
  GetScenarioGroup,
  GetScenarioGroups,
} from "../../../src-gen";
import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";

export function ScenarioGroupList(props: {
  scenarioGroups: GetScenarioGroups;
  onScenarioSelect: (scenario: GetScenario) => Promise<void>;
  hidden: boolean;
  anyScenarioIsLoading: boolean;
}) {
  return (
    <ul>
      {props.scenarioGroups.scenarioGroups.length == 0 && (
        <span hidden={props.hidden}>(empty)</span>
      )}
      {props.scenarioGroups.scenarioGroups.map(
        (scenarioGroup: GetScenarioGroup) => (
          <ScenarioGroupDisplay
            hidden={props.hidden}
            onScenarioSelect={props.onScenarioSelect}
            key={scenarioGroup.id}
            scenarioGroup={scenarioGroup}
            anyScenarioIsLoading={props.anyScenarioIsLoading}
          ></ScenarioGroupDisplay>
        ),
      )}
    </ul>
  );
}
