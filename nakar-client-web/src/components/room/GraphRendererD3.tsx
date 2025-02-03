import { createRef, useEffect, useState } from "react";
import { useTheme } from "../../lib/theme/useTheme.ts";
import { D3Renderer } from "../../lib/d3/D3Renderer.ts";
import { Node, Edge } from "../../../src-gen";
import { WebSocketsManager } from "../../lib/ws/WebSocketsManager.ts";

export function GraphRendererD3(props: {
  onNodeClicked: (node: Node) => void;
  onEdgeClicked: (edge: Edge) => void;
  webSockets: WebSocketsManager;
}) {
  const svgRef = createRef<SVGSVGElement>();
  const theme = useTheme();
  const [graphRenderer] = useState(new D3Renderer(theme));

  useEffect(() => {
    const supscriptions = [
      props.webSockets.onScenarioDataChanged$.subscribe((scenraioData) => {
        graphRenderer.loadGraphContent(scenraioData.graph);
      }),
      graphRenderer.onNodesMoved((n) => {
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
      props.webSockets.onNodesMoved$.subscribe((onMove) => {
        graphRenderer.updateNodePositions(onMove);
      }),
      graphRenderer.onDisplayNodeData((n) => {
        props.onNodeClicked(n);
      }),
      graphRenderer.onDisplayLinkData((l) => {
        props.onEdgeClicked(l);
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
