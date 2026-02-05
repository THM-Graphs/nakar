import { Stack } from "react-bootstrap";
import { ReactNode } from "react";

export function CanvasBottomFloatingToolbar(props: { children: ReactNode }) {
  return (
    <Stack
      className="position-absolute z-2 bottom-0 start-0 end-0 pe-none"
      gap={3}
    >
      {props.children}
    </Stack>
  );
}
