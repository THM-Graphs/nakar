import { ReactNode } from "react";
import { GetInitialGraph } from "../../../src-gen";
import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { GraphRendererNVL } from "./GraphRendererNVL.tsx";
import { Stack } from "react-bootstrap";

export function Canvas(props: {
  children?: ReactNode;
  graph: GetInitialGraph;
}) {
  return (
    <Stack className={"flex-grow-1"}>
      {props.children}
      <GraphRendererD3 graph={props.graph}></GraphRendererD3>
      <GraphRendererNVL graph={props.graph}></GraphRendererNVL>
      <Labels graph={props.graph}></Labels>
    </Stack>
  );
}
