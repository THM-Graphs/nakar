import { Scenario, Scenarios } from "../../../src-gen";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";

export function ScenariosList(props: {
  scenarios: Scenarios;
  onScenarioSelected: (scenario: Scenario) => void;
  hidden: boolean;
  scenarioLoading: string | null;
}) {
  return (
    <ul style={{ listStyleType: "none" }}>
      {props.scenarios.scenarios.length == 0 && (
        <span hidden={props.hidden}>(empty)</span>
      )}
      {props.scenarios.scenarios.map((scenario: Scenario) => (
        <ScenarioDisplay
          hidden={props.hidden}
          key={scenario.id}
          scenario={scenario}
          onScenarioSelected={props.onScenarioSelected}
          scenarioLoading={props.scenarioLoading}
        ></ScenarioDisplay>
      ))}
    </ul>
  );
}
