import { GraphLabel } from "../../../../src-gen";
import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";

export function Labels(props: { graphLabels: GraphLabel[] }) {
  return (
    <Stack
      className={"flex-wrap p-1 align-self-start"}
      direction={"horizontal"}
      gap={1}
      style={{
        zIndex: 1,
      }}
    >
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
  const allSources: Set<string> = new Set();
  for (const graphlabel of graphLabels) {
    for (const source of graphlabel.sources) {
      allSources.add(source);
    }
  }

  return allSources.size > 1;
}
