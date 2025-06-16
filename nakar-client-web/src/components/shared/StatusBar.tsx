import { Stack } from "react-bootstrap";
import { ReactNode } from "react";

export function StatusBar(props: { left?: ReactNode; right?: ReactNode }) {
  return (
    <Stack
      direction={"horizontal"}
      className={
        "bg-body-tertiary flex-grow-0 flex-shrink-0 border-top align-items-center"
      }
    >
      {props.left}
      <div className={"flex-grow-1"}></div>
      {props.right}
    </Stack>
  );
}
