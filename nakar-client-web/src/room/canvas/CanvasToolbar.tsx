import { Stack } from "react-bootstrap";
import { AppContext } from "../../state/AppContext.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { CanvasActions } from "./CanvasActions.tsx";
import clsx from "clsx";

export function CanvasToolbar(props: {
  context: AppContext;
  roomContext: CanvasContext;
  className?: string;
}) {
  return (
    <Stack
      direction={"vertical"}
      className={clsx("flex-grow-0 flex-shrink-0 z-2", props.className)}
    >
      <CanvasActions
        context={props.context}
        roomContext={props.roomContext}
      ></CanvasActions>
    </Stack>
  );
}
