import { GraphLabel } from "../../../src-gen";
import { getBackgroundColor } from "../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../lib/color/getTextColor.ts";
import { Stack } from "react-bootstrap";

export function Label(props: { label: GraphLabel; multipleSources: boolean }) {
  return (
    <Stack
      direction={"horizontal"}
      gap={1}
      className={"badge"}
      style={{
        backgroundColor: getBackgroundColor(props.label.color),
        color: getTextColor(props.label.color),
      }}
    >
      {props.multipleSources && <span>[{props.label.source}]</span>}
      <span>{props.label.label}</span>
      <span>({props.label.count})</span>
    </Stack>
  );
}
