import { GraphLabel } from "../../../../src-gen";
import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../lib/state/useBearStore.ts";

export function Labels() {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);

  return (
    <Stack
      className={"flex-wrap p-1 align-self-start"}
      direction={"horizontal"}
      gap={1}
      style={{
        zIndex: 1,
      }}
    >
      {labels.map((label) => (
        <Label
          label={label}
          key={label.label}
          multipleSources={multipleSources(labels)}
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
