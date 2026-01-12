import { Labels } from "../labels/Labels.tsx";
import { DataTable } from "../data-table/DataTable.tsx";
import { CanvasToolbar } from "./CanvasToolbar.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { AppContext } from "../../state/AppContext.ts";
import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { Stack } from "react-bootstrap";
import { CanvasBottomToolBar } from "./CanvasBottomToolBar.tsx";
import { PerformanceDisplay } from "./PerformanceDisplay.tsx";
import { ProgressDisplay } from "../../shared/bars/ProgressDisplay.tsx";

export function Canvas(props: {
  context: AppContext;
  roomContext: CanvasContext;
}) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);

  return (
    <Stack
      className={"flex-grow-1 flex-shrink-1 align-items-stretch"}
      direction={"vertical"}
      style={{ height: "100%", width: "100px" }}
    >
      {tabs.selected == "graph" ? (
        <Stack className={"justify-content-between"}>
          <Stack direction={"horizontal"} className={"justify-content-between"}>
            <Stack className={"z-1 flex-grow-0"} gap={3}>
              <Labels roomContext={props.roomContext}></Labels>
              <ProgressDisplay></ProgressDisplay>
            </Stack>
          </Stack>
          <CanvasBottomToolBar
            roomContext={props.roomContext}
          ></CanvasBottomToolBar>
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
