import { Labels } from "../labels/Labels.tsx";
import { DataTable } from "../data-table/DataTable.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Stack } from "react-bootstrap";
import { CanvasBottomToolBar } from "./CanvasBottomToolBar.tsx";
import { PerformanceDisplay } from "./PerformanceDisplay.tsx";
import { ProgressDisplay } from "./ProgressDisplay.tsx";
import { CanvasBottomFloatingToolbar } from "./CanvasBottomFloatingToolbar.tsx";
import { CanvasControls } from "./CanvasControls.tsx";

export function CanvasSurface() {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const users = useBearStore((s) => s.room.scenario.graph.metaData.users);

  return (
    <>
      {tabs.selected == "graph" ? (
        <Stack className={"justify-content-between"}>
          <Stack
            direction={"horizontal"}
            className={"justify-content-between"}
            gap={3}
          >
            <Stack className={"flex-grow-0"} gap={3}>
              <Labels className={"z-1"}></Labels>
              <CanvasControls
                className={"align-self-start z-1"}
              ></CanvasControls>
            </Stack>
            <Stack direction={"vertical"} gap={1} className={"flex-grow-0"}>
              {users.map((user) => (
                <Stack
                  className={
                    "small z-1 rounded bg-body-tertiary shadow-sm border ps-2 pe-2"
                  }
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
        </Stack>
      ) : (
        <>
          <DataTable></DataTable>
        </>
      )}
      <CanvasBottomFloatingToolbar>
        <ProgressDisplay></ProgressDisplay>
        <PerformanceDisplay></PerformanceDisplay>
      </CanvasBottomFloatingToolbar>
    </>
  );
}
