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

  const text: string = (() => {
    let buffer: string = "";
    if (multipleSources(labels) && props.showSources) {
      buffer += `[${(label?.sources ?? []).join(", ")}] `;
    }
    buffer += props.label;
    if (props.showAmount && (props.customAmount || label)) {
      buffer += ` (${(props.customAmount ?? label?.count ?? 0).toString()})`;
    }
    return buffer;
  })();

  return (
    <Stack
      gap={1}
      direction={"horizontal"}
      onClick={props.onClick}
      className={clsx(
        "badge flex-grow-0 flex-shrink-1 shadow-sm text-wrap text-break flex-wrap justify-content-start",
        props.onClick && "pointer",
      )}
      style={{
        backgroundColor: label ? getBackgroundColor(label.color) : "#555555",
        color: label ? getTextColor(label.color) : undefined,
      }}
    >
      <span className={"text-start"}>{text}</span>
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
