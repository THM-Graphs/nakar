import { NodeDto } from "../../../src-gen";
import { Stack } from "react-bootstrap";
import { ShortendText } from "../../shared/elements/ShortendText.tsx";

export function NodeDetailsKnowledgeCardHeader(props: { node: NodeDto }) {
  return (
    <>
      <Stack className={"sticky-top bg-body-tertiary border-bottom p-2"}>
        <h5 className={"user-select-text text-break"}>
          <ShortendText text={props.node.title}></ShortendText>
        </h5>
        <span className={"text-muted small user-select-text"}>
          {props.node.labels.join(", ")}
        </span>
      </Stack>
    </>
  );
}
