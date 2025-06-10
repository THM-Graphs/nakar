import { Stack } from "react-bootstrap";
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
} from "../../src-gen";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { GraphRendererEngine } from "../lib/graph-renderer/GraphRendererEngine.ts";
import { useWebSocketsState } from "../lib/ws/useWebSocketsState.ts";
import { ToastStack } from "../components/room/ToastStack.tsx";
import { WebSocketsManager } from "../lib/ws/WebSocketsManager.ts";
import { Env } from "../lib/env/env.ts";
import { useTheme } from "../lib/theme/useTheme.ts";
import { D3Renderer } from "../lib/d3/D3Renderer.ts";
import { Pane } from "../components/room/Pane/Pane.tsx";

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
  const [graph, setGraph] = useState<Graph | null>(null);
  const [scenariosWindowOpened, setScenariosWindowOpened] = useState(true);
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<GraphRendererEngine>("d3");
  const [scenarioProgress, setScenarioProgress] =
    useState<WSEventScenarioProgress | null>(null);
  const socketState = useWebSocketsState(props.webSockets);
  const [selectedTab, setSelectedTab] = useState<"graph" | "data">("graph");
  const theme = useTheme();
  const [graphRenderer] = useState(new D3Renderer(theme));

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
    const subscriptions = [
      props.webSockets.onScenarioLoaded$.subscribe((sd) => {
        setGraph(sd.graph);
        graphRenderer.loadGraphContent(sd.graph);
      }),
      props.webSockets.onNodesMoved$.subscribe((onMove) => {
        graphRenderer.updateNodePositions(onMove);
      }),
      props.webSockets.onSetLocks$.subscribe((message) => {
        graphRenderer.updateLocks(message);
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
          env={props.env}
          scenarioWindow={{
            isOpen: scenariosWindowOpened,
            onToggle: () => {
              setScenariosWindowOpened((isOpened) => !isOpened);
            },
          }}
          room={{
            title: loaderData.title,
            socketState: socketState,
          }}
          showBackButton={true}
          renderer={{
            current: renderer,
            onChange: setRenderer,
          }}
          webSocketsManager={props.webSockets}
          tabs={{
            state: selectedTab,
            setTab: setSelectedTab,
          }}
        ></AppNavbar>
        <ToastStack websocketsManager={props.webSockets}></ToastStack>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1"}
          style={{ height: "100px" }}
        >
          {scenariosWindowOpened && (
            <Pane
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
          )}
          {graph && (
            <Stack
              direction={"vertical"}
              className={"flex-shrink-1 flex-grow-1"}
              style={{ width: "100px" }}
            >
              {selectedTab === "graph" && (
                <Canvas
                  onExpandNodes={() => {
                    setScenarioLoading("");
                  }}
                  onDeleteNodes={() => {
                    setScenarioLoading("");
                  }}
                  renderer={renderer}
                  webSocketsManager={props.webSockets}
                  scenarioProgress={scenarioProgress}
                  scenarioLoading={scenarioLoading != null}
                  graphRenderer={graphRenderer}
                  graphLabels={graph.metaData.labels}
                  histogram={graph.metaData.histogram}
                ></Canvas>
              )}
              {selectedTab === "data" && (
                <DataTable tableData={graph.tableData}></DataTable>
              )}
            </Stack>
          )}
        </Stack>
      </Stack>
    </>
  );
}
