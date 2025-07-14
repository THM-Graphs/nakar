import { GraphLabel } from "../../../../src-gen";
import { getBackgroundColor } from "../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../lib/color/getTextColor.ts";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import clsx from "clsx";

export function Label(props: {
  label: string;
  showAmount: boolean;
  customAmount?: number;
  showSources: boolean;
  onClick?: () => void;
}) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const label = labels.find((l) => l.label === props.label);

  return (
    <Stack
      gap={1}
      direction={"horizontal"}
      onClick={props.onClick}
      className={clsx(
        "badge flex-grow-0 flex-shrink-0 justify-content-center shadow-sm",
        props.onClick && "pointer",
      )}
      style={{
        backgroundColor: label ? getBackgroundColor(label.color) : "#555555",
        color: label ? getTextColor(label.color) : undefined,
      }}
    >
      {multipleSources(labels) && props.showSources && (
        <span>[{(label?.sources ?? []).join(", ")}]</span>
      )}
      <span>{props.label}</span>
      {props.showAmount && (props.customAmount || label) && (
        <span>({props.customAmount ?? label?.count})</span>
      )}
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
