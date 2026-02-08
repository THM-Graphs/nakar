import { Stack } from "react-bootstrap";
import { NodeDto } from "../../../src-gen";
import { NodeDetailsKnowledgeCardHeader } from "./NodeDetailsKnowledgeCardHeader.tsx";
import { NodeDetailsKnowledgeCardScenarios } from "./NodeDetailsKnowledgeCardScenarios.tsx";
import { NodeDetailsKnowledgeCardProperties } from "./NodeDetailsKnowledgeCardProperties.tsx";
import { NodeDetailsKnowledgeCardRelationships } from "./NodeDetailsKnowledgeCardRelationships.tsx";

export function NodeDetailsKnowledgeCard(props: { node: NodeDto }) {
  return (
    <Stack className={"pb-5"}>
      <NodeDetailsKnowledgeCardHeader
        node={props.node}
      ></NodeDetailsKnowledgeCardHeader>
      <NodeDetailsKnowledgeCardScenarios
        node={props.node}
      ></NodeDetailsKnowledgeCardScenarios>
      <NodeDetailsKnowledgeCardProperties
        node={props.node}
      ></NodeDetailsKnowledgeCardProperties>
      <NodeDetailsKnowledgeCardRelationships
        node={props.node}
      ></NodeDetailsKnowledgeCardRelationships>
    </Stack>
  );
}
