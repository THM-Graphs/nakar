import { ReactNode } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";
import { NavbarButton } from "../../shared/NavbarButton.tsx";

export function Panel(props: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  direction: "left" | "right";
  hidden: boolean;
}) {
  if (props.hidden) {
    return null;
  }
  return (
    <Stack
      className={clsx(
        "flex-shrink-0 flex-grow-0 bg-body-tertiary overflow-hidden",
        props.direction == "left" ? "border-end" : "border-start",
      )}
      style={{
        width: "400px",
        zIndex: 1,
      }}
    >
      <Stack
        direction={"horizontal"}
        className={
          "border-bottom justify-content-between flex-shrink-0 flex-grow-0"
        }
        style={{ height: "32px" }}
      >
        {props.title.length > 0 && (
          <span className={"ms-2 small"}>{props.title}</span>
        )}
        <NavbarButton
          icon={"x-lg"}
          onClick={props.onClose}
          className={"border-end-0"}
        ></NavbarButton>
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
