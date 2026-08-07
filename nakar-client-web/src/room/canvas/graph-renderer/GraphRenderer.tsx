import { createRef, useEffect } from "react";
import { useBearStore } from "../../../state/useBearStore.ts";
import { useAppContext } from "../../../state/AppContextData.ts";
import { match } from "ts-pattern";
import { CanvasContextMenu } from "../CanvasContextMenu.tsx";
import { useTheme } from "../../../shared/theme/useTheme.ts";
import { ExpandNodePreviewAction } from "../../actions/ExpandNodePreviewAction.ts";
import { ExpandNodeAction } from "../../actions/ExpandNodeAction.ts";
import { useIsLoggedIn } from "../../../state/useIsLoggedIn.ts";
import { useCanvasContext } from "../../../pages/Canvas.tsx";
import { NodeDto } from "api-client";
import { SVGGraphRenderer } from "./renderers/svg/SVGGraphRenderer.ts";
import { CanvasZoomTransform } from "../../../shared/graphics/CanvasZoomTransform.ts";

export function GraphRenderer() {
  const context = useAppContext();
  const websocketsManager = context.webSocketsManager;
  const containerRef = createRef<HTMLDivElement>();
  const theme = useTheme();
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const setLocks = useBearStore((s) => s.room.scenario.setLocks);
  const events = useBearStore((s) => s.room.ui.rendererEvents);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const colorSchemaSlug = useBearStore((s) => s.room.canvas.colorSchemaSlug);
  const isLoggedIn = useIsLoggedIn();
  const canvasContext = useCanvasContext();

  useEffect(() => {
    if (containerRef.current == null) {
      return;
    }

    const _graphRenderer = new SVGGraphRenderer(
      theme,
      containerRef.current,
      hideLabels,
      colorSchemaSlug,
      useBearStore.getState().room.canvas.zoomTransform,
      inspector.element,
    );

    const subs: { unsubscribe: () => void }[] = [
      websocketsManager.onMessage$.subscribe((message) => {
        match(message.event)
          .with({ type: "NodesMovedWsdto" }, (event) => {
            _graphRenderer.updateNodePositions(event);
          })
          .with({ type: "SetNodeLocksWsdto" }, (event) => {
            setLocks(event.locks);
            _graphRenderer.updateLocks(event);
          })
          .with({ type: "CanvasElementsChangedWsdto" }, (event) => {
            _graphRenderer.loadGraphContent(event.elements);
          })
          .with({ type: "CanvasDataReadyWsdto" }, (event) => {
            _graphRenderer.loadGraphContent(event.data.elements);
          })
          .with({ type: "CanvasMetaDataChangedWsdto" }, (event) => {
            _graphRenderer.loadUserCursors(event.metaData.users);
          })
          .with({ type: "CursorMovedWsdto" }, (m) => {
            _graphRenderer.setUserCursorPosition(m.socketId, m.position);
          });
      }),
      _graphRenderer.onGrabNode.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "GrabNodeWsdto",
          nodeId: n.id,
        });
      }),
      _graphRenderer.onNodesMoved.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "MoveNodesWsdto",
          nodes: [
            {
              id: n.id,
              position: {
                x: n.x,
                y: n.y,
              },
            },
          ],
        });
      }),
      _graphRenderer.onUngrabNode.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "UngrabNodeWsdto",
          node: {
            id: n.id,
            position: {
              x: n.x,
              y: n.y,
            },
          },
        });
      }),
      _graphRenderer.onDisplayNodeData.subscribe((n) => {
        inspector.setElement(n.id);
      }),
      _graphRenderer.onDoubleClickNode.subscribe((n) => {
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
      _graphRenderer.onDisplayLinkData.subscribe((l) => {
        inspector.setElement(l.id);
      }),
      _graphRenderer.onDisplayNodeDataWithModifier.subscribe((n) => {
        inspector.appendElement(n.id);
      }),
      _graphRenderer.onDisplayLinkDataWithModifier.subscribe((l) => {
        inspector.appendElement(l.id);
      }),
      _graphRenderer.onDeselectAll.subscribe(() => {
        inspector.deselectElements();
      }),
      _graphRenderer.onShowNodeContextMenu.subscribe((p) => {
        events.onShowNodeContextMenu.next({
          nodeId: p.node.id,
          position: p.position,
        });
      }),
      _graphRenderer.onShowEdgeContextMenu.subscribe((p) => {
        events.onShowEdgeContextMenu.next({
          edgeId: p.edge.id,
          position: p.position,
        });
      }),
      _graphRenderer.onCursorMoved.subscribe((position) => {
        websocketsManager.sendMessage({
          type: "MoveCursorWsdto",
          position: {
            x: position[0],
            y: position[1],
          },
        });
      }),
      _graphRenderer.onZoomTransformChanged.subscribe(
        (zoomTransform: CanvasZoomTransform) => {
          useBearStore.getState().room.canvas.setZoomTransform(zoomTransform);
        },
      ),
      events.onZoomOut.subscribe(() => {
        _graphRenderer.zoomOut();
      }),
      events.onZoomIn.subscribe(() => {
        _graphRenderer.zoomIn();
      }),
      events.onCenter.subscribe(() => {
        _graphRenderer.center();
      }),
      events.onZoomOutOverview.subscribe(() => {
        _graphRenderer.zoomOutOverview();
      }),
      {
        unsubscribe: useBearStore.subscribe(
          (s) => s.global.theme,
          (t) => {
            _graphRenderer.setTheme(t.user ?? t.system);
          },
        ),
      },
      {
        unsubscribe: useBearStore.subscribe(
          (s) => s.room.canvas.hideLabels,
          (hideLabels) => {
            _graphRenderer.setHideLabels(hideLabels);
          },
        ),
      },
      {
        unsubscribe: useBearStore.subscribe(
          (s) => s.room.panels.inspector.element,
          (elements) => {
            _graphRenderer.updateSelectedElements(elements);
          },
        ),
      },
      {
        unsubscribe: useBearStore.subscribe(
          (s) => s.room.canvas.colorSchemaSlug,
          (s) => {
            _graphRenderer.setColorSchema(s);
          },
        ),
      },
    ];

    return () => {
      for (const s of subs) {
        s.unsubscribe();
      }
      _graphRenderer.dispose();
    };
  }, [websocketsManager, containerRef.current, isLoggedIn, canvasContext]);

  return (
    <>
      <div
        id={"renderer-container"}
        ref={containerRef}
        className={"position-absolute"}
        style={{ top: 0, left: 0, width: "100%", height: "100%" }}
      ></div>
      <CanvasContextMenu></CanvasContextMenu>
    </>
  );
}
