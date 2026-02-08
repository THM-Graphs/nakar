import clsx from "clsx";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { PropertyMenu } from "../properties/PropertyMenu.tsx";
import { NodeLabelColors } from "../labels/NodeLabelColors.tsx";
import { DetailPaneAction } from "../inspector-panel/DetailPaneAction.ts";

export function ValueDisplay(props: {
  label: string;
  subLabel?: string;
  value: number;
  percentage: number | null;
  nodeColors?: string[];
  onSelect?: () => void | Promise<void>;
  customActions?: DetailPaneAction[];
}) {
  return (
    <Stack>
      <Stack
        direction={"horizontal"}
        className={clsx("justify-content-between position-relative w-100")}
        gap={2}
      >
        <Stack
          direction={"horizontal"}
          className={clsx(
            "flex-shrink-1 flex-grow-1 overflow-hidden",
            props.onSelect == null && "ps-1",
          )}
        >
          {props.onSelect && (
            <NavbarButton
              icon={"crosshair"}
              onClick={props.onSelect}
              tooltip={"Select"}
              tooltipPlacement={"left"}
              className={"pt-0 pb-0 ps-0 pe-0"}
              size={"sm"}
            ></NavbarButton>
          )}
          {props.nodeColors && (
            <NodeLabelColors colors={props.nodeColors}></NodeLabelColors>
          )}
          <span
            style={{}}
            className={clsx(
              "user-select-text small flex-shrink-1 flex-grow-1 ellipsis",
            )}
          >
            {props.label}
            {props.subLabel && (
              <span className={"text-muted fst-italic"}> {props.subLabel}</span>
            )}
          </span>
        </Stack>
        <Stack direction={"horizontal"} className={"flex-shrink-0"}>
          <span className={"flex-shrink-0 user-select-text small"}>
            {props.value}{" "}
            {props.percentage != null && (
              <span className={"text-muted user-select-text"}>
                ({(props.percentage * 100).toFixed(2)}%)
              </span>
            )}
          </span>
          <PropertyMenu
            value={props.label}
            buttonSize={"sm"}
            customActions={props.customActions}
          ></PropertyMenu>
        </Stack>
      </Stack>
      {props.percentage != null && (
        <div
          style={{
            height: `4px`,
            width: `${(props.percentage * 100).toFixed(2)}%`,
          }}
          className={"bg-secondary border-2 flex-grow-0 flex-shrink-0"}
        ></div>
      )}
    </Stack>
  );
}
