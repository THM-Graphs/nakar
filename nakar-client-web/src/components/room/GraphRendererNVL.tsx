import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import { GetInitialGraph } from "../../../src-gen";
import { useUserTheme } from "../../lib/theme/useUserTheme.ts";
import { Node, Relationship } from "@neo4j-nvl/base";
import { getBackgroundColor } from "../../lib/color/getBackgroundColor.ts";
import { useEffect, useState } from "react";

export function GraphRendererNVL(props: { graph: GetInitialGraph }) {
  const [theme] = useUserTheme();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  useEffect(() => {
    const nodes: Node[] = props.graph.graph.nodes.map((n): Node => {
      return {
        id: n.id,
        captions: [
          {
            value: n.displayTitle,
            styles: ["bold"],
          },
        ],
        color: getBackgroundColor(n.labels[0].color),
        size: n.size,
      };
    });
    const rels: Relationship[] = props.graph.graph.edges.map(
      (e): Relationship => {
        const span = document.createElement("span");
        span.textContent = e.type;
        return {
          id: e.id,
          from: e.startNodeId,
          to: e.endNodeId,
          type: e.type,
          color: theme == "dark" ? "#ffffff" : "#000000",
          width: 4,
          captions: [
            {
              value: e.type,
              styles: ["bold", "#ffffff"],
            },
          ],
          captionAlign: "top",
          captionSize: 2,
        };
      },
    );
    setNodes(nodes);
    setRelationships(rels);
  }, [props.graph, theme]);

  return (
    <InteractiveNvlWrapper
      className={"flex-grow-1 flex-shrink-1"}
      style={{ flexBasis: "50%" }}
      nodes={nodes}
      rels={relationships}
      nvlOptions={{
        initialZoom: 1,
        layout: "forceDirected",
        renderer: "canvas",
      }}
      mouseEventCallbacks={{ onZoom: true, onDrag: true, onPan: true }}
    />
  );
}
