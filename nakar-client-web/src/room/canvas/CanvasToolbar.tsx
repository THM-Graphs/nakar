import { Stack } from "react-bootstrap";
import { CanvasActions } from "./CanvasActions.tsx";
import clsx from "clsx";
import { GraphDataToggle } from "../data-table/GraphDataToggle.tsx";

export function CanvasToolbar(props: { className?: string }) {
  return (
    <Stack
      direction={"horizontal"}
      className={clsx(
        "flex-grow-1 flex-shrink-0 z-2 flex-wrap justify-content-between",
        props.className,
      )}
    >
      <CanvasActions></CanvasActions>
      <GraphDataToggle></GraphDataToggle>
    </Stack>
  );
}
