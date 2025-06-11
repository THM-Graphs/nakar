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
        zIndex: 2,
        height: "32px",
      }}
    >
      <Stack direction={"horizontal"} gap={5}>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch"}
          gap={5}
        >
          {props.left}
        </Stack>
        <Stack direction={"horizontal"} gap={2}>
          <Stack direction={"horizontal"} gap={1}>
            <Image
              alt=""
              src="/logo.png"
              width="20"
              height="20"
              roundedCircle
            />
            <span className={"small fw-bold"}>NAKAR</span>
          </Stack>
          {props.center}
        </Stack>
      </Stack>
      <Stack direction={"horizontal"} className={"align-items-stretch"} gap={5}>
        {props.right}
      </Stack>
    </Stack>
  );
}
