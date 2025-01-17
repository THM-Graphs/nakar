import { ReactNode, useEffect, useState } from "react";
import { Edge, GetInitialGraph, Node } from "../../../src-gen";
import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { GraphRendererNVL } from "./GraphRendererNVL.tsx";
import { Stack } from "react-bootstrap";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";

export function Canvas(props: {
  graph: GetInitialGraph | null;
  renderer: GraphRendererEngine;
}) {
  if (props.graph == null) {
    return null;
  }

  const [detailsNode, setDetailsNode] = useState<Node | null>(null);
  const [detailsEdge, setDetailsEdge] = useState<Edge | null>(null);

  useEffect(() => {
    setDetailsNode(null);
    setDetailsEdge(null);
  }, [props.graph]);

  return (
    <Stack
      className={"flex-grow-1 align-items-start position-relative"}
      direction={"horizontal"}
    >
      {props.renderer === "d3" && (
        <GraphRendererD3
          graph={props.graph}
          onDisplayEdgeData={(e) => {
            setDetailsEdge(e);
            setDetailsNode(null);
          }}
          onDisplayNodeData={(n) => {
            setDetailsNode(n);
            setDetailsEdge(null);
          }}
        ></GraphRendererD3>
      )}
      {props.renderer === "nvl" && (
        <GraphRendererNVL graph={props.graph}></GraphRendererNVL>
      )}
      <div className={"m-2"}>
        <Labels graph={props.graph}></Labels>
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
