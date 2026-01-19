import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";
import { Stack } from "react-bootstrap";
import { ScenarioGroupDto } from "../../../src-gen";

export function ScenarioGroupList(props: {
  scenarioGroups: ScenarioGroupDto[];
}) {
  return (
    <Stack className={"flex-grow-0 pb-5"}>
      {props.scenarioGroups.length == 0 && (
        <span
          className={"small text-muted ms-1 fst-italic align-self-center pb-1"}
        >
          empty
        </span>
      )}
      {props.scenarioGroups.map((scenarioGroup: ScenarioGroupDto) => (
        <ScenarioGroupDisplay
          key={scenarioGroup.id}
          scenarioGroup={scenarioGroup}
        ></ScenarioGroupDisplay>
      ))}
    </Stack>
  );
}
