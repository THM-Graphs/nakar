import { GetInitialGraph } from "../../../src-gen";
import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";

export function Labels(props: { graph: GetInitialGraph }) {
  return (
    <Stack className={"position-absolute m-2 gap-2"} direction={"horizontal"}>
      {props.graph.graphMetaData.labels.map((label) => (
        <Label label={label} key={label.label}></Label>
      ))}
    </Stack>
  );
}
