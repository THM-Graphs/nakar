import {
  Edge,
  GraphLabel,
  Node,
  WSEventScenarioProgress,
} from "../../../../src-gen";
import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { Stack } from "react-bootstrap";
import { WebSocketsManager } from "../../../lib/ws/WebSocketsManager.ts";
import { D3Renderer } from "../../../lib/d3/D3Renderer.ts";

export function Canvas(props: {
  webSocketsManager: WebSocketsManager;
  scenarioProgress: WSEventScenarioProgress | null;
  scenarioLoading: boolean;
  onNodeClicked: (node: Node) => void;
  onEdgeClicked: (edge: Edge) => void;
  graphRenderer: D3Renderer;
  graphLabels: GraphLabel[];
  showHistogram: boolean;
  onShowHistogram: () => void;
}) {
  return (
    <Stack
      className={"flex-grow-1 align-items-start"}
      direction={"horizontal"}
      style={{ height: "100%" }}
    >
      <GraphRendererD3
        webSockets={props.webSocketsManager}
        onNodeClicked={props.onNodeClicked}
        onEdgeClicked={props.onEdgeClicked}
        graphRenderer={props.graphRenderer}
      ></GraphRendererD3>
      <Labels graphLabels={props.graphLabels}></Labels>
    </Stack>
  );
}
