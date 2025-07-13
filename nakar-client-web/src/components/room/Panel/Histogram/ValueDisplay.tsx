import clsx from "clsx";
import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { ClipboardButton } from "../../ClipboardButton.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";

export function ValueDisplay(props: {
  label: string;
  subLabel?: string;
  value: number;
  percentage: number;
  bgColors?: string[];
  onRemove?: () => void | Promise<void>;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx("gap-3 justify-content-between position-relative")}
    >
      <Stack
        direction={"horizontal"}
        className={"ps-0 flex-shrink-1 flex-grow-1 overflow-hidden "}
      >
        <ClipboardButton
          text={
            props.subLabel ? `${props.label} ${props.subLabel}` : props.label
          }
          className={"ps-1 pe-1"}
          size={"sm"}
        ></ClipboardButton>
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
        <OverlayTrigger
          placement={"left"}
          delay={{ show: 500, hide: 0 }}
          overlay={
            <Tooltip>
              {props.label} {props.subLabel && `(${props.subLabel})`}
            </Tooltip>
          }
        >
          <span
            style={{
              zIndex: 1,
            }}
            className={
              "user-select-text font-monospace small flex-shrink-1 flex-grow-1 ellipsis"
            }
          >
            {props.label}
            {props.subLabel && (
              <span className={"text-muted font-monospace"}>
                {" "}
                ({props.subLabel})
              </span>
            )}
          </span>
        </OverlayTrigger>
      </Stack>
      <Stack direction={"horizontal"} className={"flex-shrink-0"}>
        <span
          style={{ zIndex: 1 }}
          className={"pe-2 flex-shrink-0 user-select-text small"}
        >
          {props.value}{" "}
          <span className={"text-muted user-select-text"}>
            ({(props.percentage * 100).toFixed(2)}%)
          </span>
        </span>
        {props.onRemove && (
          <NavbarButton
            icon={"eye-slash"}
            onClick={props.onRemove}
            style={{ zIndex: 2 }}
            className={"pt-0 pb-0 ps-0 pe-0"}
            size={"sm"}
          ></NavbarButton>
        )}
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
