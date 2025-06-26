import { GraphElements, GraphLabel } from "../../../../src-gen";
import { getBackgroundColor } from "../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../lib/color/getTextColor.ts";
import { Stack } from "react-bootstrap";

export function Label(props: {
  label: GraphLabel;
  graphElements: GraphElements;
  showAmount: boolean;
}) {
  return (
    <Stack
      gap={1}
      direction={"horizontal"}
      className={
        "badge flex-grow-0 flex-shrink-0 justify-content-center shadow-sm"
      }
      style={{
        backgroundColor: getBackgroundColor(props.label.color),
        color: getTextColor(props.label.color),
      }}
    >
      {multipleSources(props.graphElements.labels) && (
        <span>[{props.label.sources.join(", ")}]</span>
      )}
      <span>{props.label.label}</span>
      {props.showAmount && <span>({props.label.count})</span>}
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
