import { Labels } from "../labels/Labels.tsx";
import { DataTable } from "../data-table/DataTable.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Stack } from "react-bootstrap";
import { CanvasBottomToolBar } from "./CanvasBottomToolBar.tsx";
import { PerformanceDisplay } from "./PerformanceDisplay.tsx";
import { ProgressDisplay } from "../../shared/bars/ProgressDisplay.tsx";

export function Canvas() {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const users = useBearStore((s) => s.room.scenario.graph.metaData.users);

  return (
    <Stack
      className={"flex-grow-1 flex-shrink-1 align-items-stretch"}
      direction={"vertical"}
      style={{ height: "100%", width: "100px" }}
    >
      {tabs.selected == "graph" ? (
        <Stack className={"justify-content-between"}>
          <Stack direction={"horizontal"} className={"justify-content-between"}>
            <Stack className={"z-1 flex-grow-0"} gap={1}>
              <Labels></Labels>
              <ProgressDisplay></ProgressDisplay>
            </Stack>
            <Stack direction={"vertical"} gap={1} className={"flex-grow-0"}>
              {users.map((user) => (
                <Stack
                  className={"small"}
                  key={user.id}
                  direction={"horizontal"}
                  gap={1}
                >
                  <i className={"bi bi-person"} />
                  {user.displayName ? (
                    <span>{user.displayName}</span>
                  ) : (
                    <span className={""}>Guest ({user.id})</span>
                  )}
                </Stack>
              ))}
            </Stack>
          </Stack>
          <CanvasBottomToolBar></CanvasBottomToolBar>
          <PerformanceDisplay></PerformanceDisplay>
        </Stack>
      ) : (
        <>
          <DataTable></DataTable>
        </>
      )}
    </Stack>
  );
}
