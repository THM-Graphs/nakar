import { Stack } from "react-bootstrap";
import { ReactNode } from "react";

export function AppNavbar(props: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <Stack
      direction={"horizontal"}
      className="bg-body-tertiary border-bottom justify-content-between position-relative"
      style={{
        zIndex: 2,
      }}
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
