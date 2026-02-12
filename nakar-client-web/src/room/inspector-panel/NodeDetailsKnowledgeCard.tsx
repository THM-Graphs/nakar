import { Stack } from "react-bootstrap";
import { NodeDto } from "../../../src-gen";
import { NodeDetailsKnowledgeCardHeader } from "./NodeDetailsKnowledgeCardHeader.tsx";
import { NodeDetailsKnowledgeCardScenarios } from "./NodeDetailsKnowledgeCardScenarios.tsx";
import { NodeDetailsKnowledgeCardProperties } from "./NodeDetailsKnowledgeCardProperties.tsx";
import { NodeDetailsKnowledgeCardCoverImage } from "./NodeDetailsKnowledgeCardCoverImage.tsx";

export function NodeDetailsKnowledgeCard(props: { node: NodeDto }) {
  return (
    <Stack className={"pb-5"}>
      <NodeDetailsKnowledgeCardCoverImage
        node={props.node}
      ></NodeDetailsKnowledgeCardCoverImage>
      <NodeDetailsKnowledgeCardHeader
        node={props.node}
      ></NodeDetailsKnowledgeCardHeader>
      <Stack gap={3}>
        <NodeDetailsKnowledgeCardScenarios
          node={props.node}
        ></NodeDetailsKnowledgeCardScenarios>
        <NodeDetailsKnowledgeCardProperties
          node={props.node}
        ></NodeDetailsKnowledgeCardProperties>
      </Stack>
    </Stack>
  );
}
