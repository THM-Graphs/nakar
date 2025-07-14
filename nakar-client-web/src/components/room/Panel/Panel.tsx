import { ReactNode } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";
import { NavbarButton } from "../../shared/NavbarButton.tsx";

export function Panel(props: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  direction: "left" | "right" | "center" | "none";
  hidden: boolean;
  toolbar?: ReactNode;
  fullWidth?: boolean;
  className?: string;
}) {
  return (
    <Stack
      hidden={props.hidden}
      className={clsx(
        "flex-shrink-0 flex-grow-0 bg-body-tertiary overflow-hidden",
        props.direction == "left" && "border-end",
        props.direction == "right" && "border-start",
        props.direction == "center" && "border-end border-start",
        props.className,
      )}
      style={{
        width: props.fullWidth ? undefined : "400px",
        zIndex: 1,
      }}
    >
      <Stack
        direction={"horizontal"}
        className={
          "border-bottom justify-content-between flex-shrink-0 flex-grow-0"
        }
      >
        {props.title.length > 0 && (
          <span className={"ms-2 small"}>{props.title}</span>
        )}
        <Stack direction={"horizontal"}>
          {props.toolbar}
          <NavbarButton
            icon={"x-lg"}
            onClick={props.onClose}
            className={"border-end-0"}
          ></NavbarButton>
        </Stack>
      </Stack>
      <Stack
        className={
          "overflow-y-auto flex-shrink-1 align-items-stretch justify-content-around"
        }
      >
        {props.children}
      </Stack>
    </Stack>
  );
}
