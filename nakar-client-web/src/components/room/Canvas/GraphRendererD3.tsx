import { createRef, useEffect } from "react";
import { useTheme } from "../../../lib/theme/useTheme.ts";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { match } from "ts-pattern";
import { D3Renderer } from "../../../lib/d3/D3Renderer.ts";

export function GraphRendererD3(props: { context: AppContext }) {
  const websocketsManager = props.context.webSocketsManager;
  const svgRef = createRef<SVGSVGElement>();
  const theme = useTheme();
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const setLocks = useBearStore((s) => s.room.scenario.setLocks);
  const graph = useBearStore((s) => s.room.scenario.graph);

  useEffect(() => {
    if (svgRef.current == null) {
      return;
    }
    const _graphRenderer = new D3Renderer(theme, svgRef.current, graph);

    const subs = [
      websocketsManager.onMessage$.subscribe((message) => {
        match(message)
          .with({ type: "WSEventNodesMoved" }, (event) => {
            _graphRenderer.updateNodePositions(event);
          })
          .with({ type: "WSEventSetLocks" }, (event) => {
            setLocks(event.locks);
            _graphRenderer.updateLocks(event);
          })
          .with({ type: "WSEventGraphChanged" }, (event) => {
            _graphRenderer.loadGraphContent(event.graph);
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
        requestAnimationFrame(onAnimationTick);
      }
    };
    requestAnimationFrame(onAnimationTick);

    return () => {
      for (const s of subs) {
        s.unsubscribe();
      }
      animationActive = false;
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
