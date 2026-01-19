import { Stack } from "react-bootstrap";
import { CanvasActions } from "./CanvasActions.tsx";
import clsx from "clsx";

export function CanvasToolbar(props: { className?: string }) {
  return (
    <Stack
      direction={"vertical"}
      className={clsx("flex-grow-0 flex-shrink-0 z-2", props.className)}
    >
      <CanvasActions></CanvasActions>
    </Stack>
  );
}
