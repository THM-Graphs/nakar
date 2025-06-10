import { createRef, useEffect, useState } from "react";
import { useTheme } from "../../../lib/theme/useTheme.ts";
import { D3Renderer } from "../../../lib/d3/D3Renderer.ts";
import { Node, Edge } from "../../../../src-gen";
import { WebSocketsManager } from "../../../lib/ws/WebSocketsManager.ts";

export function GraphRendererD3(props: {
  onNodeClicked: (node: Node) => void;
  onEdgeClicked: (edge: Edge) => void;
  webSockets: WebSocketsManager;
  graphRenderer: D3Renderer;
}) {
  const svgRef = createRef<SVGSVGElement>();
  const graphRenderer = props.graphRenderer;
  const theme = useTheme();

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
        props.webSockets.sendMessage({
          type: "WSActionGrabNode",
          nodeId: n.id,
        });
      }),
      graphRenderer.onNodesMoved.subscribe((n) => {
        props.webSockets.sendMessage({
          type: "WSActionMoveNodes",
          nodes: [
            {
              id: n.id,
              position: { x: n.x, y: n.y },
            },
          ],
        });
      }),
      graphRenderer.onUngrabNode.subscribe((n) => {
        props.webSockets.sendMessage({
          type: "WSActionUngrabNode",
          node: {
            id: n.id,
            position: { x: n.x, y: n.y },
          },
        });
      }),
      graphRenderer.onDisplayNodeData.subscribe((n) => {
        props.onNodeClicked(n);
      }),
      graphRenderer.onDisplayLinkData.subscribe((l) => {
        props.onEdgeClicked(l.native);
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
