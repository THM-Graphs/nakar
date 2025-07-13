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
  roomContext: RoomContext;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx("justify-content-between position-relative")}
      gap={2}
    >
      <Stack
        direction={"horizontal"}
        className={"ps-0 flex-shrink-1 flex-grow-1 overflow-hidden "}
      >
        {props.onRemove && (
          <NavbarButton
            icon={"eye-slash"}
            onClick={props.onRemove}
            style={{ zIndex: 2 }}
            className={"pt-0 pb-0 ps-0 pe-0"}
            size={"sm"}
          ></NavbarButton>
        )}
        {props.bgColors?.map((color) => (
          <div
            key={color}
            style={{
              zIndex: 1,
              width: "15px",
              height: "15px",
              backgroundColor: color,
            }}
            className={"flex-grow-0 flex-shrink-0 rounded-circle me-2"}
          ></div>
        ))}
        <span
          style={{
            zIndex: 1,
          }}
          className={clsx(
            "user-select-text font-monospace small flex-shrink-1 flex-grow-1 ellipsis",
            props.onRemove == null && "ps-1",
          )}
        >
          {props.label}
          {props.subLabel && (
            <span className={"text-muted font-monospace"}>
              {" "}
              ({props.subLabel})
            </span>
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
