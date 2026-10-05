import { createRef, useEffect } from "react";
import { match } from "ts-pattern";
import { WebGLGraphRendererSystem } from "./WebGLGraphRendererSystem.ts";
import { useAppContext } from "../../../../../state/AppContextData.ts";
import { useBearStore } from "../../../../../state/useBearStore.ts";
import { useCanvasContext } from "../../../../../pages/Canvas.tsx";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { useTheme } from "../../../../../shared/theme/useTheme.ts";
import { WebGLGraphRendererSystemFactory } from "./WebGLGraphRendererSystemFactory.ts";

export function WebGLGraphRenderer() {
  const context = useAppContext();
  const websocketsManager = context.webSocketsManager;
  const containerRef = createRef<HTMLDivElement>();
  const colorSchemaSlug = useBearStore((s) => s.room.canvas.colorSchemaSlug);
  const canvasContext = useCanvasContext();
  const setCurrentGraphRenderer = useBearStore(
    (s) => s.room.canvas.renderer.setCurrent,
  );
  const theme = useTheme();

  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }

    const subs: { unsubscribe: () => void }[] = [];

    const factory: WebGLGraphRendererSystemFactory =
      new WebGLGraphRendererSystemFactory();

    let _currentRenderer: WebGLGraphRendererSystem | null = null;

    factory
      .createInstance(ColorSchema.find(colorSchemaSlug), theme)
      .then((webGLRenderer) => {
        if (webGLRenderer == null) {
          return;
        }
        setCurrentGraphRenderer(webGLRenderer);
        _currentRenderer = webGLRenderer;
        websocketsManager.sendMessage({ type: "ClientReadyWsdto" });
        subs.push(
          websocketsManager.onMessage$.subscribe((message) => {
            match(message.event)
              .with({ type: "CanvasElementsChangedWsdto" }, (event) => {
                webGLRenderer.loadGraphContent(event.elements);
              })
              .with({ type: "CanvasDataReadyWsdto" }, (event) => {
                webGLRenderer.loadGraphContent(event.data.elements);
              })
              .with({ type: "NodesMovedWsdto" }, (event) => {
                webGLRenderer.nodesMoved(event);
              });
          }),
          webGLRenderer.onGrabNode.subscribe((n) => {
            websocketsManager.sendMessage({
              type: "GrabNodeWsdto",
              nodeId: n.label,
            });
          }),
          webGLRenderer.onNodesMoved.subscribe((n) => {
            websocketsManager.sendMessage({
              type: "MoveNodesWsdto",
              nodes: [
                {
                  id: n.label,
                  position: {
                    x: n.x,
                    y: n.y,
                  },
                },
              ],
            });
          }),
          webGLRenderer.onUngrabNode.subscribe((n) => {
            websocketsManager.sendMessage({
              type: "UngrabNodeWsdto",
              node: {
                id: n.label,
                position: {
                  x: n.x,
                  y: n.y,
                },
              },
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
      factory.destory();
      _currentRenderer?.destroy();
    };
  }, [
    containerRef.current,
    canvasContext,
    colorSchemaSlug,
    websocketsManager,
    theme,
  ]);

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
