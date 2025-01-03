import { GraphLabel } from "../../../src-gen";
import { getBackgroundColor } from "../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../lib/color/getTextColor.ts";

export function Label(props: { label: GraphLabel }) {
  return (
    <span
      className={"badge"}
      style={{
        backgroundColor: getBackgroundColor(props.label.color),
        color: getTextColor(props.label.color),
      }}
    >
      {props.label.label} ({props.label.count})
    </span>
  );
}
