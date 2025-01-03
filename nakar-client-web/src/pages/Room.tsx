import { Stack } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { SideToolbar } from "../components/room/SideToolbar.tsx";
import { DatabaseList } from "../components/room/DatabaseList.tsx";
import { Canvas } from "../components/room/Canvas.tsx";
import { DataTable } from "../components/room/DataTable.tsx";
import { useCallback, useState } from "react";
import {
  getInitialGraph,
  GetInitialGraph,
  GetRoom,
  getRoom,
} from "../../src-gen";
import { match, P } from "ts-pattern";
import { handleError } from "../lib/error/handleError.ts";
import { LoaderFunctionArgs, useLoaderData } from "react-router";

export async function RoomLoader(args: LoaderFunctionArgs): Promise<GetRoom> {
  const roomId = args.params["id"];

  if (roomId == null) {
    throw new Error("No room id provided.");
  }

  const room = await getRoom({ path: { id: roomId } });
  return match(room)
    .with(
      { data: P.nullish },
      (result: { data: undefined; error: unknown }) => {
        throw new Error(handleError(result.error));
      },
    )
    .otherwise((result: { data: GetRoom; error: undefined }): GetRoom => {
      return result.data;
    });
}

export function Room() {
  const loaderData: GetRoom = useLoaderData();
  const [graph, setGraph] = useState<GetInitialGraph | null>(null);
  const [scenariosWindowOpened, setScenariosWindowOpened] = useState(true);
  const [tableDataOpened, setTableDataOpened] = useState(false);

  const loadGraph = useCallback((scenarioId: string) => {
    getInitialGraph({ path: { id: scenarioId } })
      .then((result) => {
        if (result.error != null) {
          alert(handleError(result.error));
        } else if (result.data != null) {
          setGraph(result.data);
        } else {
          throw new Error("Unknown error");
        }
      })
      .catch((error: unknown) => {
        alert(handleError(error));
      });
  }, []);

  return (
    <>
      <Stack style={{ height: "100%" }}>
        <AppNavbar
          scenarioWindowOpen={scenariosWindowOpened}
          tableDataOpened={tableDataOpened}
          tableDataLength={graph?.tableData.length ?? 0}
          toggleScenarioWindow={() => {
            setScenariosWindowOpened((isOpened) => !isOpened);
          }}
          toggleTableData={() => {
            setTableDataOpened((isOpened) => !isOpened);
          }}
          roomTitle={loaderData.title}
        ></AppNavbar>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1"}
          style={{ height: "100px" }}
        >
          <SideToolbar visible={scenariosWindowOpened} width={500}>
            <DatabaseList
              onScenarioSelect={(scenario) => {
                loadGraph(scenario.id);
              }}
            ></DatabaseList>
          </SideToolbar>
          {graph && <Canvas graph={graph}></Canvas>}
          {graph && (
            <SideToolbar visible={tableDataOpened} width={700}>
              <DataTable graph={graph}></DataTable>
            </SideToolbar>
          )}
        </Stack>
      </Stack>
    </>
  );
}
