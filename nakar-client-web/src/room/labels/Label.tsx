import { getBackgroundColorOfLabel } from "../color/getBackgroundColor.ts";
import { getTextColor } from "../color/getTextColor.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import clsx from "clsx";
import { useColorSchema } from "../color/useColorSchema.ts";
import { DropdownButton } from "../../shared/elements/DropdownButton.tsx";
import { labelActions } from "../actions/groups/labelActions.ts";
import { ActionDropdownItem } from "../actions/ActionDropdownItem.tsx";
import { useCanvasContext } from "../../pages/CanvasPage.tsx";
import { LabelDto } from "../../../src-gen";
import { LabelViewSettingsEditor } from "../visualization-panel/LabelViewSettingsEditor.tsx";

export function Label(props: {
  label: string;
  showAmount: boolean;
  customAmount?: number;
  showSources: boolean;
  onClick?: () => void;
  className?: string;
  hideLabelMenu?: boolean;
}) {
  const roomContext = useCanvasContext();
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const label: LabelDto | null =
    labels.find((l) => l.label === props.label) ?? null;
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

  const bgColor = getBackgroundColorOfLabel(label, colorSchema);
  const color = label ? getTextColor(label.color, colorSchema) : "#fff";

  return (
    <Stack direction={"horizontal"} className={"align-items-start"}>
      <Stack
        gap={1}
        direction={"horizontal"}
        onClick={props.onClick}
        className={clsx(
          "badge rounded-0 ps-2 rounded-start flex-grow-0 flex-shrink-1 text-wrap text-break",
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
          buttonSize={"sm"}
          buttonClassName={"rounded-end"}
          buttonStyle={{
            backgroundColor: bgColor,
            color: color,
          }}
          buttonChildren={
            <i
              className={"bi bi-three-dots-vertical small"}
              style={{ color: color }}
            ></i>
          }
        >
          {labelActions.map((action) => (
            <ActionDropdownItem
              key={action.slug()}
              action={action}
              params={{
                roomContext: roomContext,
                labels: [props.label],
              }}
            ></ActionDropdownItem>
          ))}
          <Dropdown.Divider></Dropdown.Divider>
          <Dropdown.ItemText
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <LabelViewSettingsEditor
              label={props.label}
            ></LabelViewSettingsEditor>
          </Dropdown.ItemText>
        </DropdownButton>
      )}
    </Stack>
  );
}

function multipleSources(graphLabels: LabelDto[]): boolean {
  const allSources: Set<string> = new Set();
  for (const graphlabel of graphLabels) {
    for (const source of graphlabel.sources) {
      allSources.add(source);
    }
  }

  return allSources.size > 1;
}
