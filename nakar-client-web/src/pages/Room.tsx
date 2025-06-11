import { OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { DatabaseList } from "../components/room/ScenarioPane/DatabaseList.tsx";
import { Canvas } from "../components/room/Canvas/Canvas.tsx";
import { useEffect, useState } from "react";
import {
  Room as RoomSchema,
  WSEventScenarioProgress,
  getRoom,
  Graph,
  WSActionGetGraph,
} from "../../src-gen";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { useWebSocketsState } from "../lib/ws/useWebSocketsState.ts";
import { ToastStack } from "../components/room/ToastStack.tsx";
import { WebSocketsManager } from "../lib/ws/WebSocketsManager.ts";
import { Env } from "../lib/env/env.ts";
import { useTheme } from "../lib/theme/useTheme.ts";
import { D3Renderer } from "../lib/d3/D3Renderer.ts";
import { Panel } from "../components/room/Panel/Panel.tsx";
import { HistogramDisplay } from "../components/room/HistogramDisplay.tsx";
import { BackButton } from "../components/shared/BackButton.tsx";
import { ScenarioWindowButton } from "../components/room/ScenarioPane/ScenarioWindowButton.tsx";
import { ProgressDisplay } from "../components/room/ProgressDisplay.tsx";
import { SocketStateDisplay } from "../components/room/SocketStateDisplay.tsx";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";
import { NavbarButton } from "../components/shared/NavbarButton.tsx";
import { ReconnectOverlay } from "../components/room/ReconnectOverlay.tsx";
import { NavbarLogo } from "../components/shared/NavbarLogo.tsx";
import { Inspector } from "../components/room/Inspector/Inspector.tsx";
import { InspectorElement } from "../components/room/Inspector/InspectorElement.ts";

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
  const [inspectorElement, setInspectorElement] =
    useState<InspectorElement | null>(null);
  const [showInspector, setShowInspector] = useState(false);
  const [showHistogram, setShowHistogram] = useState<boolean>(false);
  const [scenariosWindowOpened, setScenariosWindowOpened] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null);
  const [scenarioProgress, setScenarioProgress] =
    useState<WSEventScenarioProgress | null>(null);
  const socketState = useWebSocketsState(props.webSockets);
  const [selectedTab, setSelectedTab] = useState<"graph" | "data">("graph");
  const theme = useTheme();
  const [graphRenderer] = useState(new D3Renderer(theme));

  useEffect(() => {
    if (inspectorElement) {
      setShowInspector(true);
    }
  }, [inspectorElement]);

  useEffect(() => {
    if (selectedTab == "data") {
      setShowInspector(false);
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
        // TODO: Check if inspector updates its ui
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
      <Stack style={{ height: "100%" }} className={"position-relative"}>
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
            </>
          }
          center={
            <Stack
              className={"align-items-center"}
              direction={"horizontal"}
              gap={2}
            >
              <NavbarLogo></NavbarLogo>
              <Stack
                className={"small text-muted"}
                direction={"horizontal"}
                gap={2}
              >
                <span>-</span>
                <span>{loaderData.title}</span>
              </Stack>
            </Stack>
          }
          right={
            <>
              <NavbarButton
                title={"Inspector"}
                selected={showInspector}
                onToggle={setShowInspector}
                icon={"info-circle-fill"}
              ></NavbarButton>
              <NavbarButton
                title={"Histogram"}
                selected={showHistogram}
                onToggle={setShowHistogram}
                icon={"bar-chart-fill"}
              ></NavbarButton>
              <Stack direction={"horizontal"} className={"align-items-stretch"}>
                <InfoDropdown env={props.env}></InfoDropdown>
              </Stack>
            </>
          }
        ></AppNavbar>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1 position-relative"}
          style={{ height: "100px" }}
        >
          <Panel
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
          </Panel>

          <Stack
            direction={"vertical"}
            className={"flex-shrink-1 flex-grow-1"}
            style={{ width: "100px" }}
          >
            <Canvas
              tab={selectedTab}
              setTab={setSelectedTab}
              graph={graph}
              onNodeClicked={(n) => {
                setInspectorElement({ type: "node", node: n });
              }}
              onEdgeClicked={(l) => {
                setInspectorElement({ type: "edge", edge: l });
              }}
              webSockets={props.webSockets}
              scenarioProgress={scenarioProgress}
              scenarioLoading={scenarioLoading != null}
              graphRenderer={graphRenderer}
              graphLabels={graph.metaData.labels}
              showHistogram={showHistogram}
              onShowHistogram={() => {
                setShowHistogram(true);
              }}
            ></Canvas>
          </Stack>

          <Inspector
            element={inspectorElement}
            hidden={!showInspector}
            onClose={() => {
              setShowInspector(false);
            }}
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
              setInspectorElement(null);
            }}
            onUnlockNode={(n) => {
              props.webSockets.sendMessage({
                type: "WSActionUnlockNodes",
                nodes: [n.id],
              });
            }}
            scenarioLoading={scenarioLoading != null}
          ></Inspector>

          <Panel
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
          </Panel>
        </Stack>
        <Stack
          direction={"horizontal"}
          className={
            "bg-body-tertiary flex-grow-0 flex-shrink-0 border-top align-items-center"
          }
          style={{ height: "25px" }}
        >
          <ProgressDisplay
            webSocketsManager={props.webSockets}
          ></ProgressDisplay>
          <div className={"flex-grow-1"}></div>
          <SocketStateDisplay socketState={socketState}></SocketStateDisplay>
        </Stack>
        <ToastStack websocketsManager={props.webSockets}></ToastStack>
        {socketState.type !== "connected" && (
          <ReconnectOverlay socketState={socketState}></ReconnectOverlay>
        )}
      </Stack>
    </>
  );
}
