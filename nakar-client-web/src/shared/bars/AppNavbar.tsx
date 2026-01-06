import { Stack } from "react-bootstrap";
import { ReactNode } from "react";
import clsx from "clsx";

export function AppNavbar(props: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx(
        "justify-content-between flex-grow-0 flex-shrink-0 z-3 border-bottom bg-body-tertiary",
        props.className,
      )}
      style={{}}
    >
      <Stack direction={"horizontal"} className={"align-items-stretch"}>
        {props.left}
      </Stack>
      <Stack direction={"horizontal"} className={"align-items-stretch"}>
        {props.center}
      </Stack>
      <Stack direction={"horizontal"} className={"align-items-stretch"}>
        {props.right}
      </Stack>
    </Stack>
  );
}
