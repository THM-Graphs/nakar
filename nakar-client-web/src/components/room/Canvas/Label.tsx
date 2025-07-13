import { GraphLabel } from "../../../../src-gen";
import { getBackgroundColor } from "../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../lib/color/getTextColor.ts";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../lib/state/useBearStore.ts";

export function Label(props: { label: string; showAmount: boolean }) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const label = labels.find((l) => l.label === props.label);

  return (
    <Stack
      gap={1}
      direction={"horizontal"}
      className={
        "badge flex-grow-0 flex-shrink-0 justify-content-center shadow-sm"
      }
      style={{
        backgroundColor: label ? getBackgroundColor(label.color) : "#f0f0f0",
        color: label ? getTextColor(label.color) : "#000000",
      }}
    >
      {multipleSources(labels) && (
        <span>[{(label?.sources ?? []).join(", ")}]</span>
      )}
      <span>{props.label}</span>
      {props.showAmount && label && <span>({label.count})</span>}
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
