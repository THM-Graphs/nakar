import { ScenarioGroup } from "../../../../../src-gen";
import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";
import { Stack } from "react-bootstrap";
import { AppContext } from "../../../../lib/state/AppContext.ts";

export function ScenarioGroupList(props: {
  scenarioGroups: ScenarioGroup[];
  context: AppContext;
}) {
  return (
    <Stack className={"flex-grow-0"}>
      {props.scenarioGroups.length == 0 && (
        <span
          className={"small text-muted ms-1 fst-italic align-self-center pb-1"}
        >
          empty
        </span>
      )}
      {props.scenarioGroups.map((scenarioGroup: ScenarioGroup) => (
        <ScenarioGroupDisplay
          context={props.context}
          key={scenarioGroup.id}
          scenarioGroup={scenarioGroup}
        ></ScenarioGroupDisplay>
      ))}
    </Stack>
  );
}
