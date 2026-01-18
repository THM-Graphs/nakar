import { Stack } from "react-bootstrap";
import { ReactNode } from "react";
import clsx from "clsx";

export function StatusBar(props: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx(
        "flex-grow-0 flex-shrink-0  align-items-center z-1",
        props.className,
      )}
    >
      {props.left}
      <div className={"flex-grow-1"}></div>
      {props.right}
    </Stack>
  );
}
