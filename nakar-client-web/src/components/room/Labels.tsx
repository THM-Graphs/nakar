import { GraphLabel } from "../../../src-gen";
import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";

export function Labels(props: { graphLabels: GraphLabel[] }) {
  return (
    <Stack className={"gap-2 flex-wrap"} direction={"horizontal"}>
      {props.graphLabels.map((label) => (
        <Label
          label={label}
          key={label.label}
          multipleSources={multipleSources(props.graphLabels)}
        ></Label>
      ))}
    </Stack>
  );
}

function multipleSources(graphLabels: GraphLabel[]): boolean {
  if (graphLabels.length == 0) {
    return false;
  }
  const compare: string = graphLabels[0].source;
  for (let i = 1; i < graphLabels.length; i += 1) {
    if (graphLabels[i].source !== compare) {
      return true;
    }
  }
  return false;
}
