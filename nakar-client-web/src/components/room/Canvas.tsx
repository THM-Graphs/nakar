import { useContext, useEffect, useState } from "react";
import { Edge, GraphLabel, Node } from "../../../src-gen";
import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { GraphRendererNVL } from "./GraphRendererNVL.tsx";
import { Stack } from "react-bootstrap";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { WebSocketsManagerContext } from "../../lib/ws/WebSocketsManagerContext.ts";

export function Canvas(props: { renderer: GraphRendererEngine }) {
  const webSocketsManager = useContext(WebSocketsManagerContext);
  const [detailsNode, setDetailsNode] = useState<Node | null>(null);
  const [detailsEdge, setDetailsEdge] = useState<Edge | null>(null);
  const [graphLabels, setGraphLabels] = useState<GraphLabel[]>([]);

  useEffect(() => {
    const s1 = webSocketsManager.onScenarioDataChanged$.subscribe((sd) => {
      setGraphLabels(sd.graph.metaData.labels);
    });

    return () => {
      s1.unsubscribe();
    };
  }, []);

  return (
    <Stack
      className={"flex-grow-1 align-items-start position-relative"}
      direction={"horizontal"}
    >
      {props.renderer === "d3" && (
        <GraphRendererD3
          onNodeClicked={(n) => {
            setDetailsNode(n);
            setDetailsEdge(null);
          }}
          onEdgeClicked={(l) => {
            setDetailsNode(null);
            setDetailsEdge(l);
          }}
        ></GraphRendererD3>
      )}
      {props.renderer === "nvl" && <GraphRendererNVL></GraphRendererNVL>}
      <div className={"m-2"}>
        <Labels graphLabels={graphLabels}></Labels>
      </div>
      <div className={"flex-grow-1"}></div>
      <div className={"m-2"}>
        {detailsNode && (
          <NodeDetails
            node={detailsNode}
            onClose={() => {
              setDetailsNode(null);
            }}
          ></NodeDetails>
        )}
        {detailsEdge && (
          <EdgeDetails
            edge={detailsEdge}
            onClose={() => {
              setDetailsEdge(null);
            }}
          ></EdgeDetails>
        )}
      </div>
    </Stack>
  );
}
