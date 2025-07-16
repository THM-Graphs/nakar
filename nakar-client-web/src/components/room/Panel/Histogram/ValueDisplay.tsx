import clsx from "clsx";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { PropertyMenu } from "../../PropertyMenu.tsx";
import { RoomContext } from "../../../../pages/Room.tsx";

export function ValueDisplay(props: {
  label: string;
  subLabel?: string;
  value: number;
  percentage: number;
  bgColors?: string[];
  onRemove?: () => void | Promise<void>;
  onSelect?: () => void | Promise<void>;
  roomContext: RoomContext;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx("justify-content-between position-relative w-100")}
      gap={2}
    >
      <Stack
        direction={"horizontal"}
        className={"ps-0 flex-shrink-1 flex-grow-1 overflow-hidden "}
      >
        {props.onSelect && (
          <NavbarButton
            icon={"crosshair"}
            onClick={props.onSelect}
            style={{ zIndex: 2 }}
            className={"pt-0 pb-0 ps-0 pe-0"}
            size={"sm"}
          ></NavbarButton>
        )}
        {props.onRemove && (
          <NavbarButton
            icon={"eye-slash"}
            onClick={props.onRemove}
            style={{ zIndex: 2 }}
            className={"pt-0 pb-0 ps-0 pe-0"}
            size={"sm"}
          ></NavbarButton>
        )}
        <Stack
          direction={"horizontal"}
          style={{
            marginRight: (props.bgColors ?? []).length === 0 ? "0px" : "12px",
          }}
        >
          {props.bgColors?.map((color, index) => (
            <div
              key={color}
              style={{
                zIndex: 1 + ((props.bgColors ?? []).length - index),
                width: "15px",
                height: "15px",
                backgroundColor: color,
                marginRight: "-8px",
              }}
              className={"flex-grow-0 flex-shrink-0 rounded-circle"}
            ></div>
          ))}
        </Stack>
        <span
          style={{
            zIndex: 1,
          }}
          className={clsx(
            "user-select-text small flex-shrink-1 flex-grow-1 ellipsis",
            props.onRemove == null && "ps-1",
          )}
        >
          {props.label}
          {props.subLabel && (
            <span className={"text-muted"}> ({props.subLabel})</span>
          )}
        </span>
      </Stack>
      <Stack direction={"horizontal"} className={"flex-shrink-0"}>
        <span
          style={{ zIndex: 1 }}
          className={"flex-shrink-0 user-select-text small"}
        >
          {props.value}{" "}
          <span className={"text-muted user-select-text"}>
            ({(props.percentage * 100).toFixed(2)}%)
          </span>
        </span>
        <PropertyMenu
          roomContext={props.roomContext}
          value={props.label}
          size={"sm"}
        ></PropertyMenu>
      </Stack>

      <div
        style={{
          position: "absolute",
          height: `100%`,
          width: `${(props.percentage * 100).toFixed(2)}%`,
        }}
        className={"bg-body-secondary border-end border-2"}
      ></div>
    </Stack>
  );
}
