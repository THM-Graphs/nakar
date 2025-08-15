import { GraphLabel } from "../../../../src-gen";
import { getBackgroundColor } from "../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../lib/color/getTextColor.ts";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import clsx from "clsx";
import { useColorSchema } from "../../../lib/color/useColorSchema.ts";
import { DropdownButton } from "../../shared/DropdownButton.tsx";
import { labelActions } from "../../../actions/groups/labelActions.ts";
import { ActionDropdownItem } from "../../../actions/ActionDropdownItem.tsx";
import { RoomContext } from "../../../pages/Room.tsx";

export function Label(props: {
  label: string;
  showAmount: boolean;
  customAmount?: number;
  showSources: boolean;
  onClick?: () => void;
  className?: string;
  roomContext: RoomContext;
  hideLabelMenu?: boolean;
}) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const label = labels.find((l) => l.label === props.label);
  const showLabelMenu: boolean =
    !(props.hideLabelMenu ?? false) && label != null;
  const colorSchema = useColorSchema();

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

  const bgColor = label
    ? getBackgroundColor(label.color, colorSchema)
    : "#555555";
  const color = label ? getTextColor(label.color, colorSchema) : "#fff";

  return (
    <Stack direction={"horizontal"}>
      <Stack
        gap={1}
        direction={"horizontal"}
        onClick={props.onClick}
        className={clsx(
          "fw-bold ps-2 pt-0 pb-0 rounded-start flex-grow-0 flex-shrink-1 shadow-sm text-wrap text-break flex-wrap justify-content-start",
          props.onClick && "pointer",
          props.className,
          !showLabelMenu && "pe-2 rounded-end",
        )}
        style={{
          backgroundColor: bgColor,
          color: color,
          fontSize: "12px",
        }}
      >
        <span className={"text-start user-select-text"}>{text}</span>
      </Stack>
      {showLabelMenu && (
        <DropdownButton
          icon={"three-dots-vertical"}
          buttonSize={"sm"}
          buttonClassName={"rounded-end"}
          buttonStyle={{
            backgroundColor: bgColor,
            color: color,
          }}
        >
          {labelActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{
                roomContext: props.roomContext,
                labels: [props.label],
              }}
            ></ActionDropdownItem>
          ))}
        </DropdownButton>
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
