import { Labels } from "./Labels.tsx";
import { DataTable } from "../DataTable.tsx";
import { CanvasToolbar } from "./CanvasToolbar.tsx";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../pages/Room.tsx";
import { Stack } from "react-bootstrap";
import { ActionNavbarButton } from "../../../actions/ActionNavbarButton.tsx";
import { ZoomToFitAction } from "../../../actions/ZoomToFitAction.ts";
import { PanToElementAction } from "../../../actions/PanToElementAction.ts";
import { ZoomInAction } from "../../../actions/ZoomInAction.ts";
import { ZoomOutAction } from "../../../actions/ZoomOutAction.ts";

export function Canvas(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);
  const element = useBearStore((s) => s.room.panels.inspector.element);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);

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
            <ActionNavbarButton
              action={PanToElementAction.shared}
              tooltipPlacement={"left"}
              params={{
                selectedElements: element,
                onCenter: rendererEvents.onCenter,
              }}
              hideTitle={true}
            ></ActionNavbarButton>
            <ActionNavbarButton
              tooltipPlacement={"left"}
              action={ZoomToFitAction.shared}
              params={{
                onZoomOutOverview: rendererEvents.onZoomOutOverview,
                nodes: nodes,
                selectedTab,
              }}
              hideTitle={true}
            ></ActionNavbarButton>
            <ActionNavbarButton
              tooltipPlacement={"left"}
              action={ZoomInAction.shared}
              params={{
                onZoomIn: rendererEvents.onZoomIn,
                nodes: nodes,
                selectedTab,
              }}
              hideTitle={true}
            ></ActionNavbarButton>
            <ActionNavbarButton
              tooltipPlacement={"left"}
              action={ZoomOutAction.shared}
              params={{
                onZoomOut: rendererEvents.onZoomOut,
                nodes: nodes,
                selectedTab,
              }}
              hideTitle={true}
            ></ActionNavbarButton>
          </Stack>
        </Stack>
      ) : (
        <DataTable></DataTable>
      )}
    </Stack>
  );
}
