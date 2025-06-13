import { Scenario } from "../../../../../src-gen";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../../../lib/state/AppContext.ts";

export function ScenariosList(props: {
  scenarios: Scenario[];
  context: AppContext;
}) {
  return (
    <Stack className={"flex-grow-0"}>
      {props.scenarios.length == 0 && <span>(empty)</span>}
      {props.scenarios.map((scenario: Scenario) => (
        <ScenarioDisplay
          key={scenario.id}
          scenario={scenario}
          context={props.context}
        ></ScenarioDisplay>
      ))}
    </Stack>
  );
}
