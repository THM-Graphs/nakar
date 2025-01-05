import { ReactNode } from "react";
import { GetInitialGraph } from "../../../src-gen";
import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { GraphRendererNVL } from "./GraphRendererNVL.tsx";
import { Stack } from "react-bootstrap";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";

export function Canvas(props: {
  children?: ReactNode;
  graph: GetInitialGraph | null;
  renderer: GraphRendererEngine;
}) {
  if (props.graph == null) {
    return null;
  }

  return (
    <Stack className={"flex-grow-1"}>
      {props.children}
      {props.renderer === "d3" && (
        <GraphRendererD3 graph={props.graph}></GraphRendererD3>
      )}
      {props.renderer === "nvl" && (
        <GraphRendererNVL graph={props.graph}></GraphRendererNVL>
      )}
      <Labels graph={props.graph}></Labels>
    </Stack>
  );
}
