import { createRef, useEffect } from "react";
import { useBearStore } from "../../state/useBearStore.ts";
import { useAppContext } from "../../state/AppContextData.ts";
import { match } from "ts-pattern";
import { D3Renderer } from "../d3/D3Renderer.ts";
import { CanvasContextMenu } from "./CanvasContextMenu.tsx";

export function GraphRendererD3() {
  const context = useAppContext();
  const websocketsManager = context.webSocketsManager;
  const svgRef = createRef<SVGSVGElement>();
  const getTheme = useBearStore((s) => s.global.theme.getTheme);
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const setLocks = useBearStore((s) => s.room.scenario.setLocks);
  const events = useBearStore((s) => s.room.ui.rendererEvents);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const colorSchemaSlug = useBearStore((s) => s.room.canvas.colorSchemaSlug);
  const theme = getTheme();

  useEffect(() => {
    if (svgRef.current == null) {
      return;
    }

    const _graphRenderer = new D3Renderer(
      theme,
      svgRef.current,
      hideLabels,
      colorSchemaSlug,
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
          .with({ type: "CursorMovedWsdto" }, (event) => {
            console.log(event);
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
          (s) => s.global.theme.user,
          () => {
            _graphRenderer.setTheme(getTheme());
          },
        ),
      },
      {
        unsubscribe: useBearStore.subscribe(
          (s) => s.global.theme.system,
          () => {
            _graphRenderer.setTheme(getTheme());
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
          () => {
            _graphRenderer.applyPropertiesToSVG();
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

    let animationActive: boolean = true;
    let lastAnimationTimeStamp: DOMHighResTimeStamp | null = null;
    const onAnimationTick = (timestamp: DOMHighResTimeStamp) => {
      if (lastAnimationTimeStamp === null) {
        lastAnimationTimeStamp = timestamp;
      }
      const deltaTime = timestamp - lastAnimationTimeStamp;
      lastAnimationTimeStamp = timestamp;
      _graphRenderer.onAnimationTick(deltaTime);
      if (animationActive) {
        animationFrame = requestAnimationFrame(onAnimationTick);
      }
    };
    let animationFrame: number = requestAnimationFrame(onAnimationTick);

    function mousemove(e: MouseEvent) {
      _graphRenderer.setCursor([e.clientX, e.clientY]);
    }
    svgRef.current.addEventListener("mousemove", mousemove);

    return () => {
      for (const s of subs) {
        s.unsubscribe();
      }
      animationActive = false;
      cancelAnimationFrame(animationFrame);
      svgRef.current?.removeEventListener("mousemove", mousemove);
    };
  }, [websocketsManager, svgRef.current]);

  return (
    <>
      <svg
        id={"svg-canvas"}
        ref={svgRef}
        className={"position-absolute"}
        style={{ top: 0, left: 0, width: "100%", height: "100%" }}
        xmlns={"http://www.w3.org/1999/xhtml"}
      >
        <g></g>
      </svg>
      <CanvasContextMenu></CanvasContextMenu>
    </>
  );
}
