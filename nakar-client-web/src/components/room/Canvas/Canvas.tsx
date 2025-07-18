import { Labels } from "./Labels.tsx";
import { Stack } from "react-bootstrap";
import { DataTable } from "../DataTable.tsx";
import { CanvasToolbar } from "./CanvasToolbar.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../pages/Room.tsx";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { postRoomActionRelayout } from "../../../../src-gen";

export function Canvas(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);

  return (
    <Stack
      className={"flex-grow-1 flex-shrink-1 align-items-stretch"}
      direction={"vertical"}
      style={{ height: "100%", width: "100px" }}
    >
      <CanvasToolbar
        context={props.context}
        roomContext={props.roomContext}
      ></CanvasToolbar>
      {tabs.selected == "graph" ? (
        <Stack direction={"horizontal"} className={"justify-content-between"}>
          <Stack className={"z-1 flex-grow-0 align-self-start"}>
            <Labels></Labels>
          </Stack>
          <Stack
            className={
              "flex-grow-0 flex-shrink-1 justify-content-end flex-wrap z-1 bg-body"
            }
            direction={"vertical"}
            gap={0}
          >
            <NavbarButton
              icon={"tropical-storm"}
              tooltip={"Relayout"}
              tooltipPlacement={"left"}
              onClick={async () => {
                resultOrThrow(
                  await postRoomActionRelayout({
                    path: { id: props.roomContext.initialRoomData.id },
                  }),
                );
              }}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"crosshair"}
              tooltip={"Pan to center"}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onCenter.next();
              }}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"aspect-ratio"}
              tooltip={"Overview"}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onZoomOutOverview.next();
              }}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"zoom-in"}
              tooltip={"Zoom In"}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onZoomIn.next();
              }}
              className={"bg-body-hover"}
            ></NavbarButton>
            <NavbarButton
              icon={"zoom-out"}
              tooltip={"Zoom Out"}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onZoomOut.next();
              }}
              className={"bg-body-hover"}
            ></NavbarButton>
          </Stack>
        </Stack>
      ) : (
        <DataTable></DataTable>
      )}
    </Stack>
  );
}
