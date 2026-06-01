import { CanvasContextData } from "../../pages/Canvas.tsx";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { useNavigate } from "react-router";
import clsx from "clsx";
import { Router } from "../../routing/Router.ts";

export function CanvasTabs(props: { canvasContext: CanvasContextData }) {
  const navigate = useNavigate();

  return (
    <Stack direction={"horizontal"} className={"border-end"}>
      {props.canvasContext.initialRoomData.canvases.map((canvas) => (
        <NavbarButton
          style={{ width: "100px" }}
          className={clsx(
            "border-start",
            canvas.id == props.canvasContext.initialCanvasData.id &&
              "bg-body-secondary",
          )}
          key={canvas.id}
          title={<span className={"ellipsis"}>{canvas.title}</span>}
          onClick={async () => {
            await navigate(
              Router.getCanvasPath(
                props.canvasContext.initialRoomData.id,
                canvas.id,
              ),
            );
          }}
        ></NavbarButton>
      ))}
    </Stack>
  );
}
