import { InteractiveNvlWrapper } from "@neo4j-nvl/react";
import { useUserTheme } from "../../lib/theme/useUserTheme.ts";
import { Node, Relationship } from "@neo4j-nvl/base";
import { useEffect, useState } from "react";
import { Graph } from "../../../src-gen";
import { WebSocketsManager } from "../../lib/ws/WebSocketsManager.ts";

export function GraphRendererNVL(props: { webSockets: WebSocketsManager }) {
  const [graph, setGraph] = useState<Graph | null>(null);
  const [theme] = useUserTheme();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);

  useEffect(() => {
    const supscriptions = [
      props.webSockets.onScenarioLoaded$.subscribe((scenraioData) => {
        setGraph(scenraioData.graph);
      }),

      props.webSockets.onNodesMoved$.subscribe((onMove) => {
        for (const movedNode of onMove.nodes) {
          const foundNode = graph?.nodes.find((n) => n.id === movedNode.id);
          if (foundNode == null) {
            continue;
          }
          foundNode.position.x = movedNode.position.x;
          foundNode.position.y = movedNode.position.y;
        }
      }),
    ];

    return () => {
      supscriptions.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  useEffect(() => {
    if (graph == null) {
      return;
    }

    const nodes: Node[] = graph.nodes.map((n): Node => {
      return {
        id: n.id,
        x: n.position.x,
        y: n.position.y,
        captions: [
          {
            value: n.title,
            styles: ["bold"],
          },
        ],
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
    <>
      {nodes.length > 0 && relationships.length > 0 && (
        <InteractiveNvlWrapper
          style={{ top: 0, left: 0, width: "100%", height: "100%" }}
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
      )}
    </>
  );
}
