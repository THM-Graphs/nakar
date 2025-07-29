import { Labels } from "./Labels.tsx";
import { Dropdown, Stack } from "react-bootstrap";
import { DataTable } from "../DataTable.tsx";
import { CanvasToolbar } from "./CanvasToolbar.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../pages/Room.tsx";
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import {
  postRoomActionRelayout,
  postRoomActionUnlockAllNodes,
} from "../../../../src-gen";
import { DropdownButton } from "../../shared/DropdownButton.tsx";

export function Canvas(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);

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
            ></NavbarButton>
            <NavbarButton
              icon={"unlock"}
              tooltip={"Unlock all nodes"}
              tooltipPlacement={"left"}
              onClick={async () => {
                resultOrThrow(
                  await postRoomActionUnlockAllNodes({
                    path: { id: props.roomContext.initialRoomData.id },
                  }),
                );
              }}
            ></NavbarButton>
            <DropdownButton
              icon={"speedometer"}
              tooltip={"Performance Settings"}
              tooltipPlacement={"left"}
              align={"end"}
            >
              <Dropdown.Header>Performance Settings</Dropdown.Header>
              <NavbarButton
                icon={"card-text"}
                title={hideLabels ? "Show Labels" : "Hide Labels"}
                onClick={() => {
                  setHideLabels(!hideLabels);
                }}
              ></NavbarButton>
            </DropdownButton>
            <NavbarButton
              icon={"crosshair"}
              tooltip={"Pan to center"}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onCenter.next();
              }}
            ></NavbarButton>
            <NavbarButton
              icon={"aspect-ratio"}
              tooltip={"Overview"}
              disabled={true}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onZoomOutOverview.next();
              }}
            ></NavbarButton>
            <NavbarButton
              icon={"zoom-in"}
              tooltip={"Zoom In"}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onZoomIn.next();
              }}
            ></NavbarButton>
            <NavbarButton
              icon={"zoom-out"}
              tooltip={"Zoom Out"}
              tooltipPlacement={"left"}
              onClick={() => {
                rendererEvents.onZoomOut.next();
              }}
            ></NavbarButton>
          </Stack>
        </Stack>
      ) : (
        <DataTable></DataTable>
      )}
    </Stack>
  );
}
