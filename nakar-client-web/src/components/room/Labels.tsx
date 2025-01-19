import { GetInitialGraph } from "../../../src-gen";
import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";

export function Labels(props: { graph: GetInitialGraph }) {
  return (
    <Stack className={"gap-2 flex-wrap"} direction={"horizontal"}>
      {props.graph.graph.metaData.labels.map((label) => (
        <Label label={label} key={label.label}></Label>
      ))}
    </Stack>
  );
}
