import { createRef, useEffect } from "react";
import { match } from "ts-pattern";
import { WebGLGraphRendererSystem } from "./WebGLGraphRendererSystem.ts";
import { useAppContext } from "../../../../../state/AppContextData.ts";
import { useBearStore } from "../../../../../state/useBearStore.ts";
import { useCanvasContext } from "../../../../../pages/Canvas.tsx";
import { ColorSchema } from "../../../../color/ColorSchema.ts";
import { useTheme } from "../../../../../shared/theme/useTheme.ts";
import { WebGLGraphRendererSystemFactory } from "./WebGLGraphRendererSystemFactory.ts";
import { NodeDto } from "api-client";
import { ExpandNodeAction } from "../../../../actions/ExpandNodeAction.ts";
import { ExpandNodePreviewAction } from "../../../../actions/ExpandNodePreviewAction.ts";
import { useIsLoggedIn } from "../../../../../state/useIsLoggedIn.ts";

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
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const isLoggedIn = useIsLoggedIn();
  const events = useBearStore((s) => s.room.ui.rendererEvents);

  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }

    const subs: { unsubscribe: () => void }[] = [];

    const factory: WebGLGraphRendererSystemFactory =
      new WebGLGraphRendererSystemFactory();

    let _currentRenderer: WebGLGraphRendererSystem | null = null;

    factory
      .createInstance(
        ColorSchema.find(colorSchemaSlug),
        theme,
        useBearStore.getState().room.canvas.zoomTransform,
      )
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
                webGLRenderer.loadUserCursors(event.data.metaData.users);
              })
              .with({ type: "NodesMovedWsdto" }, (event) => {
                webGLRenderer.nodesMoved(event);
              })
              .with({ type: "SetNodeLocksWsdto" }, (nodeLocks) => {
                webGLRenderer.setNodeLocks(nodeLocks);
              })
              .with({ type: "CanvasMetaDataChangedWsdto" }, (event) => {
                webGLRenderer.loadUserCursors(event.metaData.users);
              })
              .with({ type: "CursorMovedWsdto" }, (m) => {
                webGLRenderer.setUserCursorPosition(m.socketId, m.position);
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
          webGLRenderer.onDisplayNodeData.subscribe((n) => {
            inspector.setElement(n.id);
          }),
          webGLRenderer.onDoubleClickNode.subscribe((n) => {
            const node: NodeDto | null =
              useBearStore
                .getState()
                .room.scenario.graph.elements.nodes.find(
                  (cnode) => cnode.id === n.id,
                ) ?? null;
            if (node == null) {
              return;
            }
            if (node.isCluster) {
              ExpandNodeAction.shared.runAsync({
                isLoggedIn: isLoggedIn,
                nodes: [node],
                roomContext: canvasContext,
              });
            } else {
              ExpandNodePreviewAction.shared.runAsync({
                isLoggedIn: isLoggedIn,
                nodes: [node],
                roomContext: canvasContext,
              });
            }
          }),
          webGLRenderer.onDisplayLinkData.subscribe((l) => {
            inspector.setElement(l.id);
          }),
          webGLRenderer.onDisplayNodeDataWithModifier.subscribe((n) => {
            inspector.appendElement(n.id);
          }),
          webGLRenderer.onDisplayLinkDataWithModifier.subscribe((l) => {
            inspector.appendElement(l.id);
          }),
          webGLRenderer.onDeselectAll.subscribe(() => {
            inspector.deselectElements();
          }),
          webGLRenderer.onShowNodeContextMenu.subscribe((p) => {
            events.onShowNodeContextMenu.next({
              nodeId: p.node.id,
              position: [p.position.x, p.position.y],
            });
          }),
          webGLRenderer.onShowEdgeContextMenu.subscribe((p) => {
            events.onShowEdgeContextMenu.next({
              edgeId: p.edge.id,
              position: [p.position.x, p.position.y],
            });
          }),
          webGLRenderer.onCursorMoved.subscribe((position) => {
            websocketsManager.sendMessage({
              type: "MoveCursorWsdto",
              position: {
                x: position.x,
                y: position.y,
              },
            });
          }),
          webGLRenderer.onZoomTransformChanged.subscribe((transform) => {
            useBearStore.getState().room.canvas.setZoomTransform(transform);
          }),
          events.onZoomOut.subscribe(() => {
            webGLRenderer.zoomOut();
          }),
          events.onZoomIn.subscribe(() => {
            webGLRenderer.zoomIn();
          }),
          events.onCenter.subscribe(() => {
            webGLRenderer.center();
          }),
          events.onZoomOutOverview.subscribe(() => {
            webGLRenderer.zoomOutOverview();
          }),
          {
            unsubscribe: useBearStore.subscribe(
              (s) => s.room.panels.inspector.element,
              (elements) => {
                webGLRenderer.updateSelectedElements(elements);
              },
            ),
          },
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
