import { Stack } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { SideToolbar } from "../components/room/SideToolbar.tsx";
import { DatabaseList } from "../components/room/DatabaseList.tsx";
import { Canvas } from "../components/room/Canvas.tsx";
import { DataTable } from "../components/room/DataTable.tsx";
import { useCallback, useEffect, useState } from "react";
import {
  getInitialGraph,
  GetInitialGraph,
  GetRoom,
  getRoom,
} from "../../src-gen";
import { handleError } from "../lib/error/handleError.ts";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { GraphRendererEngine } from "../lib/graph-renderer/GraphRendererEngine.ts";

export async function RoomLoader(args: LoaderFunctionArgs): Promise<GetRoom> {
  const roomId = args.params["id"];

  if (roomId == null) {
    throw new Error("No room id provided.");
  }

  const room = await getRoom({ path: { id: roomId } });
  return resultOrThrow(room);
}

export function Room() {
  const loaderData: GetRoom = useLoaderData();
  const [graph, setGraph] = useState<GetInitialGraph | null>(null);
  const [scenariosWindowOpened, setScenariosWindowOpened] = useState(true);
  const [tableDataOpened, setTableDataOpened] = useState(false);
  const [anyScenarioIsLoading, setAnyScenarioIsLoading] = useState(false);
  const [renderer, setRenderer] = useState<GraphRendererEngine>("d3");

  const loadGraph = useCallback(async (scenarioId: string): Promise<void> => {
    try {
      const result = await getInitialGraph({ path: { id: scenarioId } });
      const data = resultOrThrow(result);
      setGraph(data);
    } catch (error: unknown) {
      alert(handleError(error));
    }
  }, []);

  useEffect(() => {
    if (graph == null) {
      return;
    }
    if (graph.graph.nodes.length == 0 && graph.tableData.length > 0) {
      setTableDataOpened(true);
    }
  }, [graph]);

  return (
    <>
      <Stack style={{ height: "100%" }}>
        <AppNavbar
          scenarioWindow={{
            isOpen: scenariosWindowOpened,
            onToggle: () => {
              setScenariosWindowOpened((isOpened) => !isOpened);
            },
          }}
          tableDataWindow={
            graph != null
              ? {
                  rowCount: graph.tableData.length,
                  isOpen: tableDataOpened,
                  onToggle: () => {
                    setTableDataOpened((isOpened) => !isOpened);
                  },
                }
              : undefined
          }
          room={{
            title: loaderData.title,
          }}
          showBackButton={true}
          renderer={{
            current: renderer,
            onChange: setRenderer,
          }}
        ></AppNavbar>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1"}
          style={{ height: "100px" }}
        >
          <SideToolbar hidden={!scenariosWindowOpened} width={500}>
            {() => (
              <DatabaseList
                onScenarioSelect={async (scenario) => {
                  try {
                    setAnyScenarioIsLoading(true);
                    await loadGraph(scenario.id);
                  } finally {
                    setAnyScenarioIsLoading(false);
                  }
                }}
                anyScenarioIsLoading={anyScenarioIsLoading}
              ></DatabaseList>
            )}
          </SideToolbar>
          <Canvas renderer={renderer} graph={graph}></Canvas>
          <SideToolbar hidden={!tableDataOpened} width={700}>
            {() => <DataTable graph={graph}></DataTable>}
          </SideToolbar>
        </Stack>
      </Stack>
    </>
  );
}
