import { Scenario, Scenarios } from "../../../src-gen";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";
import { Stack } from "react-bootstrap";

export function ScenariosList(props: {
  scenarios: Scenarios;
  onScenarioSelected: (scenario: Scenario) => void;
  hidden: boolean;
  scenarioLoading: string | null;
}) {
  return (
    <Stack>
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
    </Stack>
  );
}
