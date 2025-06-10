import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { DatabaseList } from "../components/room/ScenarioPane/DatabaseList.tsx";
import { Canvas } from "../components/room/Canvas/Canvas.tsx";
import { DataTable } from "../components/room/DataTable.tsx";
import { useEffect, useState } from "react";
import {
  Room as RoomSchema,
  WSEventScenarioProgress,
  getRoom,
  Graph,
  Edge,
  Node,
  WSActionRelayout,
  WSActionGetGraph,
} from "../../src-gen";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { useWebSocketsState } from "../lib/ws/useWebSocketsState.ts";
import { ToastStack } from "../components/room/ToastStack.tsx";
import { WebSocketsManager } from "../lib/ws/WebSocketsManager.ts";
import { Env } from "../lib/env/env.ts";
import { useTheme } from "../lib/theme/useTheme.ts";
import { D3Renderer } from "../lib/d3/D3Renderer.ts";
import { Pane } from "../components/room/Pane/Pane.tsx";
import { NodeDetails } from "../components/room/DetailPane/NodeDetails.tsx";
import { EdgeDetails } from "../components/room/DetailPane/EdgeDetails.tsx";
import { HistogramDisplay } from "../components/room/HistogramDisplay.tsx";
import { BackButton } from "../components/shared/BackButton.tsx";
import { ScenarioWindowButton } from "../components/room/ScenarioPane/ScenarioWindowButton.tsx";
import { GraphDataToggle } from "../components/room/GraphDataToggle.tsx";
import { ProgressDisplay } from "../components/room/ProgressDisplay.tsx";
import { SocketStateDisplay } from "../components/room/SocketStateDisplay.tsx";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";
import { NavbarButton } from "../components/shared/NavbarButton.tsx";

export async function RoomLoader(
  args: LoaderFunctionArgs,
): Promise<RoomSchema> {
  const roomId = args.params["id"];

  if (roomId == null) {
    throw new Error("No room id provided.");
  }

  const room = await getRoom({ path: { id: roomId } });
  return resultOrThrow(room);
}

export function Room(props: { webSockets: WebSocketsManager; env: Env }) {
  const loaderData: RoomSchema = useLoaderData();
  const [graph, setGraph] = useState<Graph>({
    nodes: [],
    edges: [],
    tableData: [],
    metaData: {
      labels: [],
      histogram: {
        nodeLabels: [],
        edgeTypes: [],
        edgeProperties: [],
        nodeProperties: [],
      },
      pipelineSummary: [],
      scenarioInfo: {
        id: "",
        title: null,
      },
    },
  });
  const [detailsNode, setDetailsNode] = useState<Node | null>(null);
  const [detailsEdge, setDetailsEdge] = useState<Edge | null>(null);
  const [showHistogram, setShowHistogram] = useState<boolean>(false);
  const [scenariosWindowOpened, setScenariosWindowOpened] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null);
  const [scenarioProgress, setScenarioProgress] =
    useState<WSEventScenarioProgress | null>(null);
  const socketState = useWebSocketsState(props.webSockets);
  const [selectedTab, setSelectedTab] = useState<"graph" | "data">("graph");
  const theme = useTheme();
  const [graphRenderer] = useState(new D3Renderer(theme));
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedTab == "data") {
      setDetailsNode(null);
      setDetailsEdge(null);
    }
  }, [selectedTab]);

  useEffect(() => {
    if (socketState.type === "connected") {
      props.webSockets.sendMessage({
        type: "WSActionJoinRoom",
        roomId: loaderData.id,
      });
      setScenarioLoading(null);
    }
  }, [socketState]);

  useEffect(() => {
    if (socketState.type === "connected") {
      props.webSockets.sendMessage({
        type: "WSActionGetGraph",
      });
    }
  }, []);

  useEffect(() => {
    graphRenderer.loadGraphContent(graph);
  }, [graph]);

  useEffect(() => {
    const subscriptions = [
      props.webSockets.onGraphChanged$.subscribe((sd) => {
        setGraph(sd.graph);
      }),
      props.webSockets.onRoomChanged$.subscribe((sd) => {
        if (sd.roomId != null) {
          props.webSockets.sendMessage({
            type: "WSActionGetGraph",
          } satisfies WSActionGetGraph);
        }
      }),
      props.webSockets.onNodesMoved$.subscribe((onMove) => {
        graphRenderer.updateNodePositions(onMove);
      }),
      props.webSockets.onSetLocks$.subscribe((message) => {
        graphRenderer.updateLocks(message);
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
      props.webSockets.onScenarioProgress$.subscribe((progress) => {
        if (progress.progress == null) {
          setScenarioProgress(null);
          setScenarioLoading(null);
        } else {
          setScenarioProgress(progress);
        }
      }),
      props.webSockets.onNotification$.subscribe(() => {
        setScenarioLoading(null);
      }),
    ];

    return () => {
      subscriptions.forEach((s) => {
        s.unsubscribe();
      });
    };
  }, []);

  return (
    <>
      <Stack style={{ height: "100%" }}>
        <AppNavbar
          left={
            <>
              <BackButton href={"/"} title={"Rooms"}></BackButton>
              <ScenarioWindowButton
                isOpen={scenariosWindowOpened}
                onToggle={() => {
                  setScenariosWindowOpened((old) => !old);
                }}
              ></ScenarioWindowButton>
              <GraphDataToggle
                state={selectedTab}
                setTab={setSelectedTab}
              ></GraphDataToggle>
            </>
          }
          center={
            <>
              <span>-</span>
              <span className={"small text-muted"}>{loaderData.title}</span>
              {graph.metaData.scenarioInfo.title && (
                <>
                  <span>-</span>
                  <span className={"small text-muted"}>
                    ({graph.metaData.scenarioInfo.title})
                  </span>
                </>
              )}
            </>
          }
          right={
            <>
              <ProgressDisplay
                webSocketsManager={props.webSockets}
              ></ProgressDisplay>
              <Stack direction={"horizontal"}>
                <OverlayTrigger
                  delay={{ show: 500, hide: 0 }}
                  placement="bottom"
                  overlay={<Tooltip>Relayout Graph</Tooltip>}
                >
                  <NavbarButton
                    icon={"tropical-storm"}
                    title={"Layout Graph"}
                    className={"border-end-0"}
                    onClick={() => {
                      props.webSockets.sendMessage({
                        type: "WSActionRelayout",
                      } satisfies WSActionRelayout);
                    }}
                  ></NavbarButton>
                </OverlayTrigger>
                <OverlayTrigger
                  delay={{ show: 500, hide: 0 }}
                  overlay={<Tooltip>Histogram</Tooltip>}
                  placement="bottom"
                >
                  <NavbarButton
                    title={"Histogram"}
                    selected={showHistogram}
                    onToggle={setShowHistogram}
                    icon={"bar-chart-fill"}
                  ></NavbarButton>
                </OverlayTrigger>
              </Stack>
              <Stack direction={"horizontal"} className={"align-items-stretch"}>
                <InfoDropdown env={props.env}></InfoDropdown>
                <SocketStateDisplay
                  socketState={socketState}
                ></SocketStateDisplay>
              </Stack>
            </>
          }
        ></AppNavbar>
        <ToastStack websocketsManager={props.webSockets}></ToastStack>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1 position-relative"}
          style={{ height: "100px" }}
        >
          <Pane
            hidden={!scenariosWindowOpened}
            direction={"left"}
            onClose={() => {
              setScenariosWindowOpened(false);
            }}
            title={"Scenarios"}
          >
            <DatabaseList
              onScenarioSelect={(scenario) => {
                setScenarioLoading(scenario.id);
                props.webSockets.sendMessage({
                  type: "WSActionLoadScenario",
                  scenarioId: scenario.id,
                });
              }}
              scenarioLoading={scenarioLoading}
            ></DatabaseList>
          </Pane>

          <Stack
            direction={"vertical"}
            className={"flex-shrink-1 flex-grow-1"}
            style={{ width: "100px" }}
          >
            {selectedTab === "graph" && (
              <Canvas
                onNodeClicked={(n) => {
                  setDetailsNode(n);
                  setDetailsEdge(null);
                }}
                onEdgeClicked={(l) => {
                  setDetailsEdge(l);
                  setDetailsNode(null);
                }}
                webSocketsManager={props.webSockets}
                scenarioProgress={scenarioProgress}
                scenarioLoading={scenarioLoading != null}
                graphRenderer={graphRenderer}
                graphLabels={graph.metaData.labels}
                showHistogram={showHistogram}
                onShowHistogram={() => {
                  setShowHistogram(true);
                }}
              ></Canvas>
            )}
            {selectedTab === "data" && (
              <DataTable tableData={graph.tableData}></DataTable>
            )}
          </Stack>

          <NodeDetails
            node={detailsNode}
            onExpandNode={(n) => {
              setScenarioLoading("");
              props.webSockets.sendMessage({
                type: "WSActionExpandNodes",
                nodes: [n.id],
              });
            }}
            onDeleteNode={(n) => {
              setScenarioLoading("");
              props.webSockets.sendMessage({
                type: "WSActionDeleteNodes",
                nodes: [n.id],
              });
              setDetailsNode(null);
            }}
            onUnlockNode={(n) => {
              props.webSockets.sendMessage({
                type: "WSActionUnlockNodes",
                nodes: [n.id],
              });
            }}
            onClose={() => {
              setDetailsNode(null);
            }}
            scenarioLoading={scenarioLoading != null}
          ></NodeDetails>
          <EdgeDetails
            edge={detailsEdge}
            onClose={() => {
              setDetailsEdge(null);
            }}
          ></EdgeDetails>
          <Pane
            hidden={!showHistogram}
            direction={"right"}
            title={"Histogram"}
            onClose={() => {
              setShowHistogram(false);
            }}
          >
            <HistogramDisplay
              histogram={graph.metaData.histogram}
              graphLabels={graph.metaData.labels}
            ></HistogramDisplay>
          </Pane>
        </Stack>
      </Stack>
    </>
  );
}
