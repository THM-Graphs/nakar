import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import { useUserTheme } from "../../lib/theme/useUserTheme.ts";
import { Node, Relationship } from "@neo4j-nvl/base";
import { getBackgroundColor } from "../../lib/color/getBackgroundColor.ts";
import { useEffect, useState } from "react";
import { Graph } from "../../../src-gen";

export function GraphRendererNVL() {
  const [graph] = useState<Graph | null>(null);
  const [theme] = useUserTheme();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  useEffect(() => {
    if (graph == null) {
      return;
    }

    const nodes: Node[] = graph.nodes.map((n): Node => {
      return {
        id: n.id,
        captions: [
          {
            value: n.title,
            styles: ["bold"],
          },
        ],
        color:
          n.customBackgroundColor ??
          getBackgroundColor(
            graph.metaData.labels.find((l) => l.label === n.labels[0])?.color ??
              null,
          ),
        size: n.radius,
      };
    });
    const rels: Relationship[] = graph.edges.map((e): Relationship => {
      const span = document.createElement("span");
      span.textContent = e.type;
      return {
        id: e.id,
        from: e.startNodeId,
        to: e.endNodeId,
        type: e.type,
        color: theme == "dark" ? "#ffffff" : "#000000",
        width: e.width,
        captions: [
          {
            value: e.type,
            styles: ["bold", "#ffffff"],
          },
        ],
        captionAlign: "top",
        captionSize: 2,
      };
    });
    setNodes(nodes);
    setRelationships(rels);
  }, [graph, theme]);

  return (
    <InteractiveNvlWrapper
      className={"position-absolute"}
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
