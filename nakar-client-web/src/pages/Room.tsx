import { Stack } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { SideToolbar } from "../components/room/SideToolbar.tsx";
import { DatabaseList } from "../components/room/DatabaseList.tsx";
import { Canvas } from "../components/room/Canvas.tsx";
import { DataTable } from "../components/room/DataTable.tsx";
import { useEffect, useState } from "react";
import {
  Room as RoomSchema,
  WSEventScenarioProgress,
  getRoom,
} from "../../src-gen";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { GraphRendererEngine } from "../lib/graph-renderer/GraphRendererEngine.ts";
import { useWebSocketsState } from "../lib/ws/useWebSocketsState.ts";
import { ToastStack } from "../components/room/ToastStack.tsx";
import { WebSocketsManager } from "../lib/ws/WebSocketsManager.ts";
import { Env } from "../lib/env/env.ts";

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
  const [tableData, setTableData] = useState<Record<string, unknown>[] | null>(
    null,
  );
  const [scenariosWindowOpened, setScenariosWindowOpened] = useState(false);
  const [tableDataOpened, setTableDataOpened] = useState(false);
  const [scenarioLoading, setScenarioLoading] = useState<string | null>(null);
  const [renderer, setRenderer] = useState<GraphRendererEngine>("d3");
  const [scenarioProgress, setScenarioProgress] =
    useState<WSEventScenarioProgress | null>(null);
  const socketState = useWebSocketsState(props.webSockets);

  useEffect(() => {
    if (socketState.type === "connected") {
      props.webSockets.sendMessage({
        type: "WSActionJoinRoom",
        roomId: loaderData.id,
      });
    }
  }, [socketState]);

  useEffect(() => {
    const subscriptions = [
      props.webSockets.onScenarioLoaded$.subscribe((sd) => {
        setTableData(sd.graph.tableData);
      }),
      props.webSockets.onScenarioProgress$.subscribe((progress) => {
        if (progress.progress == null) {
          setScenarioProgress(null);
          setScenarioLoading(null);
        } else {
          setScenarioProgress(progress);
        }
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
          tableDataWindow={
            tableData != null
              ? {
                  rowCount: tableData.length,
                  isOpen: tableDataOpened,
                  onToggle: () => {
                    setTableDataOpened((isOpened) => !isOpened);
                  },
                }
              : undefined
          }
          room={{
            title: loaderData.title,
            socketState: socketState,
          }}
          showBackButton={true}
          renderer={{
            current: renderer,
            onChange: setRenderer,
          }}
        ></AppNavbar>
        <ToastStack websocketsManager={props.webSockets}></ToastStack>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1"}
          style={{ height: "100px" }}
        >
          <SideToolbar hidden={!scenariosWindowOpened} width={500}>
            {() => (
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
            )}
          </SideToolbar>
          <Canvas
            renderer={renderer}
            webSocketsManager={props.webSockets}
            scenarioProgress={scenarioProgress}
          ></Canvas>
          <SideToolbar hidden={!tableDataOpened} width={700}>
            {() => <DataTable tableData={tableData}></DataTable>}
          </SideToolbar>
        </Stack>
      </Stack>
    </>
  );
}
