import { createRef, useContext, useEffect, useState } from "react";
import { useTheme } from "../../lib/theme/useTheme.ts";
import { D3Renderer } from "../../lib/d3/D3Renderer.ts";
import { WebSocketsManagerContext } from "../../lib/ws/WebSocketsManagerContext.ts";
import { Node, Edge } from "../../../src-gen";

export function GraphRendererD3(props: {
  onNodeClicked: (node: Node) => void;
  onEdgeClicked: (edge: Edge) => void;
}) {
  const svgRef = createRef<SVGSVGElement>();
  const theme = useTheme();
  const [graphRenderer] = useState(new D3Renderer(theme));
  const webSockets = useContext(WebSocketsManagerContext);

  useEffect(() => {
    const s1 = webSockets.onScenarioDataChanged$.subscribe((scenraioData) => {
      graphRenderer.loadGraphContent(scenraioData.graph);
    });
    const s2 = graphRenderer.onNodesMoved(() => {
      webSockets.sendMessage({
        type: "WSActionMoveNodes",
        nodes: graphRenderer.graphState.nodes.map((n) => ({
          id: n.id,
          position: { x: n.x, y: n.y },
        })),
      });
    });
    const s3 = webSockets.onNodesMoved$.subscribe((onMove) => {
      graphRenderer.updateNodePositions(onMove);
    });
    const s4 = graphRenderer.onDisplayNodeData((n) => {
      props.onNodeClicked(n);
    });
    const s5 = graphRenderer.onDisplayLinkData((l) => {
      props.onEdgeClicked(l);
    });

    return () => {
      s1.unsubscribe();
      s2.unsubscribe();
      s3.unsubscribe();
      s4.unsubscribe();
      s5.unsubscribe();
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
