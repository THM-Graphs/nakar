import { GetScenario, GetScenarios } from "../../../src-gen";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";

export function ScenariosList(props: {
  scenarios: GetScenarios;
  onScenarioSelected: (scenario: GetScenario) => Promise<void>;
  collapsed: boolean;
  anyScenarioIsLoading: boolean;
}) {
  return (
    <ul style={{ listStyleType: "none" }}>
      {props.scenarios.scenarios.length == 0 && (
        <span hidden={props.collapsed}>(empty)</span>
      )}
      {props.scenarios.scenarios.map((scenario: GetScenario) => (
        <ScenarioDisplay
          collapsed={props.collapsed}
          key={scenario.id}
          scenario={scenario}
          onScenarioSelected={props.onScenarioSelected}
          anyScenarioIsLoading={props.anyScenarioIsLoading}
        ></ScenarioDisplay>
      ))}
    </ul>
  );
}
