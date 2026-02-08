import { NodeDto } from "../../../src-gen";
import { Stack } from "react-bootstrap";

export function NodeDetailsKnowledgeCardHeader(props: { node: NodeDto }) {
  return (
    <>
      <Stack className={"sticky-top bg-body-tertiary border-bottom p-2"}>
        <h5 className={"user-select-text "}>{props.node.title}</h5>
        <span className={"text-muted small"}>
          {props.node.labels.join(", ")}
        </span>
      </Stack>
    </>
  );
}
