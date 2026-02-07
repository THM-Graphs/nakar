import { ReactNode } from "react";
import { Stack } from "react-bootstrap";
import clsx from "clsx";

export function CanvasActionsGroup(props: {
  children?: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx(
        "align-self-stretch border-end justify-content-end flex-shrink-1 flex-grow-0",
        props.className,
      )}
    >
      {props.title.length > 0 && (
        <span
          className={"text-muted small fst-italic ps-2 pe-2 align-self-center"}
        >
          {props.title}
        </span>
      )}
      <Stack
        direction={"horizontal"}
        className={"flex-wrap justify-content-start"}
      >
        {props.children}
      </Stack>
    </Stack>
  );
}
