import {
  Edge,
  GraphLabel,
  Node,
  WSActionRelayout,
  WSEventScenarioProgress,
} from "../../../../src-gen";
import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { GraphRendererNVL } from "./GraphRendererNVL.tsx";
import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { GraphRendererEngine } from "../../../lib/graph-renderer/GraphRendererEngine.ts";
import { WebSocketsManager } from "../../../lib/ws/WebSocketsManager.ts";
import { D3Renderer } from "../../../lib/d3/D3Renderer.ts";

export function Canvas(props: {
  renderer: GraphRendererEngine;
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
      {props.renderer === "d3" && (
        <GraphRendererD3
          webSockets={props.webSocketsManager}
          onNodeClicked={props.onNodeClicked}
          onEdgeClicked={props.onEdgeClicked}
          graphRenderer={props.graphRenderer}
        ></GraphRendererD3>
      )}
      {props.renderer === "nvl" && (
        <GraphRendererNVL
          webSockets={props.webSocketsManager}
        ></GraphRendererNVL>
      )}
      <Stack
        direction={"horizontal"}
        className={"border-bottom bg-body align-self-start flex-grow-1"}
        style={{ zIndex: 1 }}
      >
        <Labels graphLabels={props.graphLabels}></Labels>
        <OverlayTrigger
          delay={{ show: 500, hide: 0 }}
          placement="left"
          overlay={<Tooltip>Relayout Graph</Tooltip>}
        >
          <Button
            variant={"icon"}
            className={
              "border-start m-0 rounded-0 ps-2 pe-2 pt-0 pb-0 flex-grow-0"
            }
            onClick={() => {
              props.webSocketsManager.sendMessage({
                type: "WSActionRelayout",
              } satisfies WSActionRelayout);
            }}
          >
            <i className={`bi bi-tropical-storm`}></i>
          </Button>
        </OverlayTrigger>
        {!props.showHistogram && (
          <OverlayTrigger
            delay={{ show: 500, hide: 0 }}
            overlay={<Tooltip>Histogram</Tooltip>}
            placement="left"
          >
            <Button
              variant={"icon"}
              className={"border-start m-0 rounded-0 ps-2 pe-2 pt-0 pb-0"}
              onClick={props.onShowHistogram}
            >
              <i className={"bi bi-bar-chart-fill"}></i>
            </Button>
          </OverlayTrigger>
        )}
      </Stack>
    </Stack>
  );
}
