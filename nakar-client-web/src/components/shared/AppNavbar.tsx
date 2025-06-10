import { Image, Stack } from "react-bootstrap";
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
        zIndex: 600,
        height: "30px",
      }}
    >
      <Stack direction={"horizontal"} className={"align-items-stretch"} gap={5}>
        {props.left}
      </Stack>
      <Stack
        direction={"horizontal"}
        gap={2}
        className={
          "ps-1 pe-1 position-absolute justify-content-center align-content-center"
        }
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <Stack direction={"horizontal"} gap={1}>
          <Image alt="" src="/logo.png" width="20" height="20" roundedCircle />
          <span className={"small fw-bold"}>NAKAR</span>
        </Stack>
        {props.center}
      </Stack>
      <Stack direction={"horizontal"} className={"align-items-stretch"} gap={5}>
        {props.right}
      </Stack>
    </Stack>
  );
}
