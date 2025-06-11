import { GraphLabel } from "../../../../src-gen";
import { getBackgroundColor } from "../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../lib/color/getTextColor.ts";
import { Stack } from "react-bootstrap";

export function Label(props: { label: GraphLabel; multipleSources: boolean }) {
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
      {props.multipleSources && <span>[{props.label.sources.join(", ")}]</span>}
      <span>{props.label.label}</span>
      <span>({props.label.count})</span>
    </Stack>
  );
}
