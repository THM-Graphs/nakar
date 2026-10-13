import { Stack } from "react-bootstrap";
import { CanvasActions } from "./CanvasActions.tsx";
import clsx from "clsx";

export function CanvasToolbar(props: { className?: string }) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx(
        "flex-grow-0 flex-shrink-0 z-2 flex-wrap justify-content-between border rounded overflow-hidden bg-frosted-glass",
        props.className,
      )}
    >
      <CanvasActions></CanvasActions>
    </Stack>
  );
}
