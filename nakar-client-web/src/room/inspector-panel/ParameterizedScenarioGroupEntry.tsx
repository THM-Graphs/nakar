import { NodeDto, ScenarioGroupDto } from "../../../src-gen";
import { NodeParameterizedScenarioEntry } from "./NodeParameterizedScenarioEntry.tsx";
import { Stack } from "react-bootstrap";

export function ParameterizedScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroupDto;
  node: NodeDto;
  className?: string;
}) {
  const scenarioGroup = props.scenarioGroup;

  return (
    <Stack className={props.className}>
      <span className={"small fw-bold"}>{props.scenarioGroup.title}</span>
      {scenarioGroup.scenarios.map((scenario) => {
        return (
          <NodeParameterizedScenarioEntry
            scenario={scenario}
            node={props.node}
            key={scenario.id}
          ></NodeParameterizedScenarioEntry>
        );
      })}
    </Stack>
  );
}
