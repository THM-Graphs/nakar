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
              node={props.node}
              key={scenarioGroup.id}
              className={"p-2 border-bottom"}
            ></ParameterizedScenarioGroupEntry>
          ))}
        </>
      )}
    </>
  );
}
