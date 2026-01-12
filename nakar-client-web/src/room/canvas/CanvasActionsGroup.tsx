import { ReactNode } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function CanvasActionsGroup(props: {
  children?: ReactNode;
  title: string;
  className?: string;
  fillWidth?: boolean;
}) {
  return (
    <Stack
      direction={"vertical"}
      className={clsx(
        "align-self-stretch border-end",
        props.fillWidth
          ? "flex-shrink-0 flex-grow-0"
          : "flex-shrink-1 flex-grow-1",
        props.className,
      )}
    >
      <span
        className={"text-muted small fst-italic ps-1 pe-1 align-self-center"}
      >
        {props.title}
      </span>
      <Stack
        direction={"horizontal"}
        className={"flex-wrap justify-content-start"}
      >
        {props.children}
      </Stack>
    </Stack>
  );
}
