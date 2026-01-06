import { Stack } from "react-bootstrap";
import { ReactNode } from "react";

export function StatusBar(props: { left?: ReactNode; right?: ReactNode }) {
  return (
    <Stack
      direction={"horizontal"}
      className={"flex-grow-0 flex-shrink-0  align-items-center z-1"}
    >
      {props.left}
      <div className={"flex-grow-1"}></div>
      {props.right}
    </Stack>
  );
}
