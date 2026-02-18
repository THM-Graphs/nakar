import { NodeDto } from "../../../src-gen";
import { ParameterizedScenarioGroupEntry } from "./ParameterizedScenarioGroupEntry.tsx";

export function NodeDetailsKnowledgeCardScenarios(props: { node: NodeDto }) {
  return (
    <>
      {props.node.parameterizedScenarios.length > 0 && (
        <>
          {props.node.parameterizedScenarios.map((scenarioGroup) => (
            <ParameterizedScenarioGroupEntry
              scenarioGroup={scenarioGroup}
              nodes={[props.node]}
              key={scenarioGroup.id}
            ></ParameterizedScenarioGroupEntry>
          ))}
        </>
      )}
    </>
  );
}
