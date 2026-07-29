import { ReactNode } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";
import { NavbarButton } from "./NavbarButton.tsx";

export function Panel(props: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  toolbar?: ReactNode;
  className?: string;
}) {
  return (
    <Stack
      className={clsx(
        "flex-shrink-1 flex-grow-1 z-1 overflow-y-hidden bg-body-tertiary h-100",
        props.className,
      )}
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
