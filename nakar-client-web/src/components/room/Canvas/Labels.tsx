import { Label } from "./Label.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../lib/state/useBearStore.ts";

export function Labels() {
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);

  return (
    <Stack
      className={"flex-wrap p-1 align-self-start"}
      direction={"horizontal"}
      gap={1}
      style={{
        zIndex: 1,
      }}
    >
      {graphElements.labels.map((label) => (
        <Label label={label.label} key={label.label} showAmount={true}></Label>
      ))}
    </Stack>
  );
}
