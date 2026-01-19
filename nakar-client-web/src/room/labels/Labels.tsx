import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";

export function Labels() {
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);

  return (
    <Stack
      className={"flex-wrap align-self-start"}
      direction={"horizontal"}
      gap={1}
      style={{}}
    >
      {graphElements.labels.map((label) => (
        <Label
          label={label.label}
          key={label.label}
          showAmount={true}
          showSources={true}
        ></Label>
      ))}
    </Stack>
  );
}
