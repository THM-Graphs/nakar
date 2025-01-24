import { GraphLabel } from "../../../src-gen";
import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";

export function Labels(props: { graphLabels: GraphLabel[] }) {
  return (
    <Stack className={"gap-2 flex-wrap"} direction={"horizontal"}>
      {props.graphLabels.map((label) => (
        <Label label={label} key={label.label}></Label>
      ))}
    </Stack>
  );
}
