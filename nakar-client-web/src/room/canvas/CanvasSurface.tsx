import { Labels } from "../labels/Labels.tsx";
import { DataTable } from "../data-table/DataTable.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Stack } from "react-bootstrap";
import { CanvasBottomToolBar } from "./CanvasBottomToolBar.tsx";
import { PerformanceDisplay } from "./PerformanceDisplay.tsx";
import { ProgressDisplay } from "./ProgressDisplay.tsx";
import { CanvasBottomFloatingToolbar } from "./CanvasBottomFloatingToolbar.tsx";
import { CanvasControls } from "./CanvasControls.tsx";
import { CanvasUsersList } from "./CanvasUsersList.tsx";

export function CanvasSurface() {
  const tabs = useBearStore((s) => s.room.canvas.tabs);

  return (
    <>
      {tabs.selected == "graph" ? (
        <Stack
          className={"justify-content-between p-3 h-100 position-relative"}
          gap={3}
        >
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
            <CanvasUsersList></CanvasUsersList>
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
