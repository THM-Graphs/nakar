import { createRef, useEffect } from "react";
import { match } from "ts-pattern";
import { WebGLGraphRendererSystem } from "./WebGLGraphRendererSystem.ts";
import { useAppContext } from "../../../../../state/AppContextData.ts";
import { useBearStore } from "../../../../../state/useBearStore.ts";
import { useCanvasContext } from "../../../../../pages/Canvas.tsx";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
export function WebGLGraphRenderer() {
  const context = useAppContext();
  const websocketsManager = context.webSocketsManager;
  const containerRef = createRef<HTMLDivElement>();
  const colorSchemaSlug = useBearStore((s) => s.room.canvas.colorSchemaSlug);
  const canvasContext = useCanvasContext();
  const setCurrentGraphRenderer = useBearStore(
    (s) => s.room.canvas.renderer.setCurrent,
  );

  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }
    const webGLRenderer: WebGLGraphRendererSystem =
      new WebGLGraphRendererSystem();
    const subs: { unsubscribe: () => void }[] = [];
    webGLRenderer
      .init(containerRef.current, ColorSchema.find(colorSchemaSlug))
      .then(() => {
        setCurrentGraphRenderer(webGLRenderer);
        websocketsManager.sendMessage({ type: "ClientReadyWsdto" });
        subs.push(
          websocketsManager.onMessage$.subscribe((message) => {
            match(message.event)
              .with({ type: "CanvasElementsChangedWsdto" }, (event) => {
                webGLRenderer.loadGraphContent(event.elements);
              })
              .with({ type: "CanvasDataReadyWsdto" }, (event) => {
                webGLRenderer.loadGraphContent(event.data.elements);
              });
          }),
        );
      })
      .catch(console.error);

    return () => {
      setCurrentGraphRenderer(null);
      for (const sub of subs) {
        sub.unsubscribe();
      }
      webGLRenderer.deinit();
    };
  }, [containerRef.current, canvasContext, colorSchemaSlug, websocketsManager]);

  return (
    <>
      <div
        id={"renderer-container"}
        ref={containerRef}
        className={"position-absolute"}
        style={{ top: 0, left: 0, width: "100%", height: "100%" }}
      ></div>
    </>
  );
}
