import { createRef, useEffect } from "react";
import { useTheme } from "../../../lib/theme/useTheme.ts";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { match } from "ts-pattern";
import { D3Renderer } from "../../../lib/d3/D3Renderer.ts";
import { RoomContext } from "../../../pages/Room.tsx";

export function GraphRendererD3(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const maxElementsBeforHide: number = 300;
  const websocketsManager = props.context.webSocketsManager;
  const svgRef = createRef<SVGSVGElement>();
  const theme = useTheme();
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const setLocks = useBearStore((s) => s.room.scenario.setLocks);
  const events = useBearStore((s) => s.room.ui.rendererEvents);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);

  useEffect(() => {
    if (svgRef.current == null) {
      return;
    }

    const initialHideLabels: boolean =
      props.roomContext.initialGraphData.elements.nodes.length +
        props.roomContext.initialGraphData.elements.edges.length >
      maxElementsBeforHide;

    setHideLabels(initialHideLabels);

    const _graphRenderer = new D3Renderer(
      theme,
      svgRef.current,
      props.roomContext.initialGraphData.elements,
      initialHideLabels,
    );

    const subs: { unsubscribe: () => void }[] = [
      websocketsManager.onMessage$.subscribe((message) => {
        match(message)
          .with({ type: "WSEventNodesMoved" }, (event) => {
            _graphRenderer.updateNodePositions(event);
          })
          .with({ type: "WSEventSetNodeLocks" }, (event) => {
            setLocks(event.locks);
            _graphRenderer.updateLocks(event);
          })
          .with({ type: "WSEventGraphElementsChanged" }, (event) => {
            _graphRenderer.loadGraphContent(event.elements);
            setHideLabels(
              event.elements.nodes.length + event.elements.edges.length >
                maxElementsBeforHide,
            );
          });
      }),
      _graphRenderer.onGrabNode.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "WSActionGrabNode",
          nodeId: n.id,
        });
      }),
      _graphRenderer.onNodesMoved.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "WSActionMoveNodes",
          nodes: [
            {
              id: n.id,
              position: { x: n.x, y: n.y },
            },
          ],
        });
      }),
      _graphRenderer.onUngrabNode.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "WSActionUngrabNode",
          node: {
            id: n.id,
            position: { x: n.x, y: n.y },
          },
        });
      }),
      _graphRenderer.onDisplayNodeData.subscribe((n) => {
        inspector.setElement({ type: "node", nodeId: n.id });
      }),
      _graphRenderer.onDisplayLinkData.subscribe((l) => {
        inspector.setElement({ type: "edge", edgeId: l.id });
      }),
      _graphRenderer.onDeselectAll.subscribe(() => {
        inspector.deselectElement();
      }),
      events.onZoomOut.subscribe(() => {
        _graphRenderer.zoomOut();
      }),
      events.onCenter.subscribe(() => {
        _graphRenderer.center();
      }),
      events.onZoomOutOverview.subscribe(() => {
        _graphRenderer.zoomOutOverview();
      }),
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

    return () => {
      for (const s of subs) {
        s.unsubscribe();
      }
      animationActive = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [websocketsManager, svgRef.current, theme]);

  return (
    <svg
      ref={svgRef}
      className={"position-absolute"}
      style={{ top: 0, left: 0, width: "100%", height: "100%" }}
      xmlns={"http://www.w3.org/1999/xhtml"}
    >
      <g></g>
    </svg>
  );
}
