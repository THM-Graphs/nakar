import { GetScenario, GetScenarios } from "../../../src-gen";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";

export function ScenariosList(props: {
  scenarios: GetScenarios;
  onScenarioSelected: (scenario: GetScenario) => Promise<void>;
  hidden: boolean;
  anyScenarioIsLoading: boolean;
}) {
  return (
    <ul style={{ listStyleType: "none" }}>
      {props.scenarios.scenarios.length == 0 && (
        <span hidden={props.hidden}>(empty)</span>
      )}
      {props.scenarios.scenarios.map((scenario: GetScenario) => (
        <ScenarioDisplay
          hidden={props.hidden}
          key={scenario.id}
          scenario={scenario}
          onScenarioSelected={props.onScenarioSelected}
          anyScenarioIsLoading={props.anyScenarioIsLoading}
        ></ScenarioDisplay>
      ))}
    </ul>
  );
}
