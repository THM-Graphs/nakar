import { CanvasContextMenu } from "../CanvasContextMenu.tsx";
import { SVGGraphRenderer } from "./renderers/svg/SVGGraphRenderer.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { match } from "ts-pattern";
import { WebGLGraphRenderer } from "./renderers/webgl/WebGLGraphRenderer.tsx";

export function GraphRenderer() {
  const rendererMode = useBearStore((s) => s.room.canvas.renderer.mode);

  return (
    <>
      {match(rendererMode)
        .with("svg", () => <SVGGraphRenderer></SVGGraphRenderer>)
        .with("webgl", () => <WebGLGraphRenderer></WebGLGraphRenderer>)
        .exhaustive()}
      <CanvasContextMenu></CanvasContextMenu>
    </>
  );
}
