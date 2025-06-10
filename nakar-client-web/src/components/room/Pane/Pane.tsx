import { ReactNode } from "react";
import { CloseButton, Stack } from "react-bootstrap";
import clsx from "clsx";

export function Pane(props: {
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
        className={"border-bottom justify-content-between flex-0"}
      >
        {props.title.length > 0 && (
          <span className={"ms-2 text-muted"}>{props.title}</span>
        )}
        <CloseButton className={"m-1"} onClick={props.onClose}></CloseButton>
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
