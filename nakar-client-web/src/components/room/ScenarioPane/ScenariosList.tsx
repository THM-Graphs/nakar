import { Scenario, Scenarios } from "../../../../src-gen";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";
import { Stack } from "react-bootstrap";

export function ScenariosList(props: {
  scenarios: Scenarios;
  onScenarioSelected: (scenario: Scenario) => void;
  scenarioLoading: string | null;
}) {
  return (
    <Stack className={"flex-grow-0"}>
      {props.scenarios.scenarios.length == 0 && <span>(empty)</span>}
      {props.scenarios.scenarios.map((scenario: Scenario) => (
        <ScenarioDisplay
          key={scenario.id}
          scenario={scenario}
          onScenarioSelected={props.onScenarioSelected}
          scenarioLoading={props.scenarioLoading}
        ></ScenarioDisplay>
      ))}
    </Stack>
  );
}
