import { createRef, useEffect } from "react";
import { useTheme } from "../../../lib/theme/useTheme.ts";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { match } from "ts-pattern";

export function GraphRendererD3(props: { context: AppContext }) {
  const websocketsManager = props.context.webSocketsManager;
  const svgRef = createRef<SVGSVGElement>();
  const graphRenderer = props.context.renderer;
  const theme = useTheme();
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const graph = useBearStore((s) => s.room.scenario.graph);

  useEffect(() => {
    graphRenderer.loadGraphContent(graph);
  }, [graph]);

  useEffect(() => {
    const subs = [
      websocketsManager.onMessage$.subscribe((message) => {
        match(message)
          .with({ type: "WSEventNodesMoved" }, (event) => {
            graphRenderer.updateNodePositions(event);
          })
          .with({ type: "WSEventSetLocks" }, (event) => {
            graphRenderer.updateLocks(event);
            // TODO: Check if inspector updates its ui
          })
          .run();
      }),
    ];
    return () => {
      for (const s of subs) {
        s.unsubscribe();
      }
    };
  }, [websocketsManager]);

  useEffect(() => {
    let animationActive: boolean = true;
    let lastAnimationTimeStamp: DOMHighResTimeStamp | null = null;

    const onAnimationTick = (timestamp: DOMHighResTimeStamp) => {
      if (lastAnimationTimeStamp === null) {
        lastAnimationTimeStamp = timestamp;
      }
      const deltaTime = timestamp - lastAnimationTimeStamp;
      lastAnimationTimeStamp = timestamp;

      graphRenderer.onAnimationTick(deltaTime);
      if (animationActive) {
        requestAnimationFrame(onAnimationTick);
      }
    };
    requestAnimationFrame(onAnimationTick);

    return () => {
      animationActive = false;
    };
  }, []);

  useEffect(() => {
    const supscriptions = [
      graphRenderer.onGrabNode.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "WSActionGrabNode",
          nodeId: n.native.id,
        });
      }),
      graphRenderer.onNodesMoved.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "WSActionMoveNodes",
          nodes: [
            {
              id: n.native.id,
              position: { x: n.x, y: n.y },
            },
          ],
        });
      }),
      graphRenderer.onUngrabNode.subscribe((n) => {
        websocketsManager.sendMessage({
          type: "WSActionUngrabNode",
          node: {
            id: n.native.id,
            position: { x: n.x, y: n.y },
          },
        });
      }),
      graphRenderer.onDisplayNodeData.subscribe((n) => {
        inspector.setElement({ type: "node", node: n.native });
      }),
      graphRenderer.onDisplayLinkData.subscribe((l) => {
        inspector.setElement({ type: "edge", edge: l.native });
      }),
    ];

    return () => {
      supscriptions.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  useEffect(() => {
    graphRenderer.setTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (svgRef.current == null) {
      return;
    }
    graphRenderer.setSVGElement(svgRef.current);
  }, [svgRef.current]);

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
