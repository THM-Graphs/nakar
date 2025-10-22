import { Labels } from "../labels/Labels.tsx";
import { DataTable } from "../data-table/DataTable.tsx";
import { CanvasToolbar } from "./CanvasToolbar.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { AppContext } from "../../state/AppContext.ts";
import { RoomContext } from "../../pages/Room.tsx";
import { Stack } from "react-bootstrap";
import { ActionNavbarButton } from "../../actions/ActionNavbarButton.tsx";
import { ZoomToFitAction } from "../../actions/ZoomToFitAction.ts";
import { PanToElementAction } from "../../actions/PanToElementAction.ts";
import { ZoomInAction } from "../../actions/ZoomInAction.ts";
import { ZoomOutAction } from "../../actions/ZoomOutAction.ts";
import { RelayoutAction } from "../../actions/RelayoutAction.ts";
import { UnlockAllNodesAction } from "../../actions/UnlockAllNodesAction.ts";
import { HideLabelsAction } from "../../actions/HideLabelsAction.ts";
import { ConnectResultNodesAction } from "../../actions/ConnectResultNodesAction.ts";
import { RemoveDanglingNodesAction } from "../../actions/RemoveDanglingNodesAction.ts";
import { CompressRelationshipsAction } from "../../actions/CompressRelationshipsAction.ts";
import { useState } from "react";

export function Canvas(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const tabs = useBearStore((s) => s.room.canvas.tabs);
  const rendererEvents = useBearStore((s) => s.room.ui.rendererEvents);
  const element = useBearStore((s) => s.room.panels.inspector.element);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const selectedTab = useBearStore((s) => s.room.canvas.tabs.selected);
  const hideLabels = useBearStore((s) => s.room.canvas.hideLabels);
  const setHideLabels = useBearStore((s) => s.room.canvas.setHideLabels);
  const uiLocked = useBearStore((s) => s.room.ui.locked);
  const scenario = useBearStore((s) => s.room.scenario.graph.metaData.scenario);
  const [hideTitles, setHideTitles] = useState<boolean>(true);

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
            <Labels roomContext={props.roomContext}></Labels>
          </Stack>
          <Stack
            className={
              "flex-grow-0 flex-shrink-1 justify-content-end flex-wrap z-1 bg-body"
            }
            direction={"vertical"}
            gap={2}
            onMouseEnter={() => {
              setHideTitles(false);
            }}
            onMouseLeave={() => {
              setHideTitles(true);
            }}
          >
            <Stack>
              <ActionNavbarButton
                action={PanToElementAction.shared}
                tooltipPlacement={"left"}
                params={{
                  selectedElements: element,
                  onCenter: rendererEvents.onCenter,
                }}
                hideTitle={hideTitles}
              ></ActionNavbarButton>
              <ActionNavbarButton
                tooltipPlacement={"left"}
                action={ZoomToFitAction.shared}
                params={{
                  onZoomOutOverview: rendererEvents.onZoomOutOverview,
                  nodes: nodes,
                  selectedTab,
                }}
                hideTitle={hideTitles}
              ></ActionNavbarButton>
              <ActionNavbarButton
                action={HideLabelsAction.shared}
                params={{ hideLabels, setHideLabels, selectedTab }}
                hideTitle={hideTitles}
                tooltipPlacement={"left"}
              ></ActionNavbarButton>
            </Stack>
            <Stack>
              <ActionNavbarButton
                tooltipPlacement={"left"}
                action={ZoomInAction.shared}
                params={{
                  onZoomIn: rendererEvents.onZoomIn,
                  nodes: nodes,
                  selectedTab,
                }}
                hideTitle={hideTitles}
              ></ActionNavbarButton>
              <ActionNavbarButton
                tooltipPlacement={"left"}
                action={ZoomOutAction.shared}
                params={{
                  onZoomOut: rendererEvents.onZoomOut,
                  nodes: nodes,
                  selectedTab,
                }}
                hideTitle={hideTitles}
              ></ActionNavbarButton>
            </Stack>
            <Stack>
              <ActionNavbarButton
                action={RelayoutAction.shared}
                params={{
                  roomContext: props.roomContext,
                  nodes,
                  selectedTab,
                  uiLocked,
                }}
                hideTitle={hideTitles}
                tooltipPlacement={"left"}
              ></ActionNavbarButton>
              <ActionNavbarButton
                action={UnlockAllNodesAction.shared}
                params={{
                  roomContext: props.roomContext,
                  nodes,
                  selectedTab,
                  uiLocked,
                }}
                hideTitle={hideTitles}
                tooltipPlacement={"left"}
              ></ActionNavbarButton>
            </Stack>
            <Stack>
              <ActionNavbarButton
                action={ConnectResultNodesAction.shared}
                params={{
                  roomContext: props.roomContext,
                  scenario: scenario?.current ?? null,
                  uiLocked,
                  selectedTab,
                }}
                hideTitle={hideTitles}
                tooltipPlacement={"left"}
              ></ActionNavbarButton>
              <ActionNavbarButton
                action={RemoveDanglingNodesAction.shared}
                params={{
                  roomContext: props.roomContext,
                  scenario: scenario?.current ?? null,
                  uiLocked,
                  selectedTab,
                }}
                hideTitle={hideTitles}
                tooltipPlacement={"left"}
              ></ActionNavbarButton>
              <ActionNavbarButton
                action={CompressRelationshipsAction.shared}
                params={{
                  roomContext: props.roomContext,
                  scenario: scenario?.current ?? null,
                  uiLocked,
                  selectedTab,
                }}
                hideTitle={hideTitles}
                tooltipPlacement={"left"}
              ></ActionNavbarButton>
            </Stack>
          </Stack>
        </Stack>
      ) : (
        <DataTable></DataTable>
      )}
    </Stack>
  );
}
