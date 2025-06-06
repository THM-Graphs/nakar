import { useEffect, useState } from "react";
import {
  Edge,
  GraphLabel,
  Node,
  WSActionRelayout,
  WSEventScenarioProgress,
} from "../../../src-gen";
import { Labels } from "./Labels.tsx";
import { GraphRendererD3 } from "./GraphRendererD3.tsx";
import { GraphRendererNVL } from "./GraphRendererNVL.tsx";
import { Button, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { WebSocketsManager } from "../../lib/ws/WebSocketsManager.ts";
import { GraphProgressDisplay } from "./GraphProgressDisplay.tsx";
import { DetailPane } from "./DetailPane/DetailPane.tsx";

export function Canvas(props: {
  renderer: GraphRendererEngine;
  webSocketsManager: WebSocketsManager;
  scenarioProgress: WSEventScenarioProgress | null;
  scenarioLoading: boolean;
  onExpandNodes: () => void;
  onDeleteNodes: () => void;
}) {
  const [detailsNode, setDetailsNode] = useState<Node | null>(null);
  const [detailsEdge, setDetailsEdge] = useState<Edge | null>(null);
  const [showHistogram, setShowHistogram] = useState<boolean>(false);
  const [graphLabels, setGraphLabels] = useState<GraphLabel[]>([]);

  useEffect(() => {
    const subs = [
      props.webSocketsManager.onScenarioLoaded$.subscribe((sd) => {
        setGraphLabels(sd.graph.metaData.labels);
      }),
      props.webSocketsManager.onSetLocks$.subscribe((message) => {
        for (const node of message.locks) {
          if (detailsNode?.id === node.id) {
            setDetailsNode((old) => {
              if (old == null) {
                return null;
              }
              return {
                ...old,
                locked: node.locked,
              };
            });
          }
        }
      }),
    ];

    return () => {
      subs.forEach((sub) => {
        sub.unsubscribe();
      });
    };
  }, [detailsNode]);

  return (
    <Stack
      className={"flex-grow-1 align-items-start position-relative"}
      direction={"horizontal"}
      style={{ height: "100%" }}
    >
      {props.renderer === "d3" && (
        <GraphRendererD3
          webSockets={props.webSocketsManager}
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
      {props.renderer === "nvl" && (
        <GraphRendererNVL
          webSockets={props.webSocketsManager}
        ></GraphRendererNVL>
      )}
      <div className={"m-2"} style={{ zIndex: 1 }}>
        <Labels graphLabels={graphLabels}></Labels>
      </div>
      {props.scenarioProgress && (
        <div className={"position-absolute bottom-0 m-2"}>
          <GraphProgressDisplay
            graphProgress={props.scenarioProgress}
          ></GraphProgressDisplay>
        </div>
      )}
      <div className={"flex-grow-1"}></div>
      <OverlayTrigger overlay={<Tooltip>Relayout Graph</Tooltip>}>
        <Button
          style={{ zIndex: 1 }}
          variant={"icon"}
          onClick={() => {
            props.webSocketsManager.sendMessage({
              type: "WSActionRelayout",
            } satisfies WSActionRelayout);
          }}
        >
          <i className={`bi bi-tropical-storm`}></i>
        </Button>
      </OverlayTrigger>
      {!showHistogram && (
        <OverlayTrigger overlay={<Tooltip>Histogram</Tooltip>}>
          <Button
            variant={"icon"}
            style={{ zIndex: 1 }}
            onClick={() => {
              setShowHistogram(true);
            }}
          >
            <i className={"bi bi-bar-chart-fill"}></i>
          </Button>
        </OverlayTrigger>
      )}
      {detailsNode && (
        <NodeDetails
          node={detailsNode}
          onExpandNode={() => {
            props.webSocketsManager.sendMessage({
              type: "WSActionExpandNodes",
              nodes: [detailsNode.id],
            });
            props.onExpandNodes();
          }}
          onDeleteNode={() => {
            props.webSocketsManager.sendMessage({
              type: "WSActionDeleteNodes",
              nodes: [detailsNode.id],
            });
            props.onDeleteNodes();
            setDetailsNode(null);
          }}
          onUnlockNode={() => {
            props.webSocketsManager.sendMessage({
              type: "WSActionUnlockNodes",
              nodes: [detailsNode.id],
            });
          }}
          onClose={() => {
            setDetailsNode(null);
          }}
          scenarioLoading={props.scenarioLoading}
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
      {showHistogram && (
        <DetailPane
          actions={[]}
          entityTitle={"Histogram"}
          loading={false}
          onClose={() => {
            setShowHistogram(false);
          }}
          otherProperties={[]}
          properties={[]}
          title={""}
        ></DetailPane>
      )}
    </Stack>
  );
}
