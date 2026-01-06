import { Stack } from "react-bootstrap";
import { AppNavbar } from "../shared/bars/AppNavbar.tsx";
import { useEffect } from "react";
import {
  CanvasPage as SchemaCanvasPage,
  Canvas as SchemaCanvas,
  GetScenariosResult,
  Graph,
  Room as SchemaRoom,
  WSActionLeaveCanvas,
  getCanvasPage,
} from "../../src-gen";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { ToastStack } from "../shared/bars/ToastStack.tsx";
import { HistogramPanel } from "../room/histogram-panel/HistogramPanel.tsx";
import { ScenariosPanelButton } from "../room/scenarios-panel/ScenariosPanelButton.tsx";
import { ProgressDisplay } from "../shared/bars/ProgressDisplay.tsx";
import { SocketStateDisplay } from "../shared/socket/SocketStateDisplay.tsx";
import { ReconnectOverlay } from "../shared/socket/ReconnectOverlay.tsx";
import { NavbarLogo } from "../shared/bars/NavbarLogo.tsx";
import { InspectorPanel } from "../room/inspector-panel/InspectorPanel.tsx";
import { useBearStore } from "../state/useBearStore.ts";
import { AppContext } from "../state/AppContext.ts";
import { ScenariosPanel } from "../room/scenarios-panel/ScenariosPanel.tsx";
import { InspectorPanelButton } from "../room/inspector-panel/InspectorPanelButton.tsx";
import { HistogramPanelButton } from "../room/histogram-panel/HistogramPanelButton.tsx";
import { StatusBar } from "../shared/bars/StatusBar.tsx";
import { match } from "ts-pattern";
import { PerformanceDisplay } from "../room/canvas/PerformanceDisplay.tsx";
import { RunScenarioModal } from "../room/run-scenario-modal/RunScenarioModal.tsx";
import { ExpandNodePreviewModal } from "../room/expand-node-preview-modal/ExpandNodePreviewModal.tsx";
import { QueryPanel } from "../room/query-panel/QueryPanel.tsx";
import { QueryPanelButton } from "../room/query-panel/QueryPanelButton.tsx";
import { GraphRendererD3 } from "../room/canvas/GraphRendererD3.tsx";
import { MenuBar } from "../shared/bars/MenuBar.tsx";
import { ActionNavbarButton } from "../room/actions/ActionNavbarButton.tsx";
import { CloseRoomAction } from "../room/actions/CloseRoomAction.ts";
import { NotesPanel } from "../room/notes-panel/NotesPanel.tsx";
import { NotesPanelButton } from "../room/notes-panel/NotesPanelButton.tsx";
import { AddEditNoteModal } from "../room/notes-panel/AddEditNoteModal.tsx";
import { AuthButton } from "../shared/auth/AuthButton.tsx";
import { SearchPanel } from "../room/search-panel/SearchPanel.tsx";
import { SearchPanelButton } from "../room/search-panel/SearchPanelButton.tsx";
import { Canvas } from "../room/canvas/Canvas.tsx";
import { VisualizationPanelButton } from "../room/visualization-panel/VisualizationPanelButton.tsx";
import { VisualizationPanel } from "../room/visualization-panel/VisualizationPanel.tsx";

export type CanvasContext = {
  initialCanvasData: SchemaCanvas;
  initialScenariosData: GetScenariosResult;
  initialRoomData: SchemaRoom;
};

export async function CanvasLoader(
  args: LoaderFunctionArgs,
): Promise<CanvasContext> {
  const canvasId = args.params["id"];

  if (canvasId == null) {
    throw new Error("No canvas id provided.");
  }

  const data: SchemaCanvasPage = resultOrThrow(
    await getCanvasPage({ path: { id: canvasId } }),
  );

  return {
    initialCanvasData: data.canvas,
    initialScenariosData: data.scenarios,
    initialRoomData: data.room,
  };
}

export function CanvasPage(props: { context: AppContext }) {
  const roomContext: CanvasContext = useLoaderData();
  const setGraph = useBearStore((s) => s.room.scenario.setGraph);
  const setGraphElements = useBearStore(
    (s) => s.room.scenario.setGraphElements,
  );
  const setGraphMetaData = useBearStore(
    (s) => s.room.scenario.setGraphMetaData,
  );
  const setGraphTable = useBearStore((s) => s.room.scenario.setGraphTable);
  const socketState = useBearStore((s) => s.room.websockets.state);
  const setProgress = useBearStore((s) => s.room.ui.setProgress);
  const clearProgress = useBearStore((s) => s.room.ui.clearProgress);
  const clearPerformance = useBearStore((s) => s.room.ui.clearPerformance);
  const webSockets = props.context.webSocketsManager;
  const setPerformance = useBearStore((s) => s.room.ui.setPerformance);
  const setScenarios = useBearStore(
    (s) => s.room.panels.scenarios.setScenarios,
  );
  const pushNotification = useBearStore((s) => s.room.ui.pushNotification);
  const navigate = useNavigate();
  const setVisualizationData = useBearStore(
    (s) => s.room.panels.visualization.setData,
  );
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const rightPanel = useBearStore((s) => s.room.panels.right);

  useEffect(() => {
    setScenarios(roomContext.initialScenariosData);
    setVisualizationData(roomContext.initialCanvasData.viewSettings);
  }, [roomContext]);

  useEffect(() => {
    if (socketState.type === "connected") {
      webSockets.sendMessage({
        type: "WSActionJoinCanvas",
        canvasId: roomContext.initialCanvasData.id,
      });
      clearProgress();
      clearPerformance();
    }
  }, [socketState]);

  useEffect(() => {
    const subscriptions = [
      webSockets.onMessage$.subscribe((message) => {
        match(message)
          .with({ type: "WSEventGraphMetaDataChanged" }, (event) => {
            setGraphMetaData(event.metaData);
          })
          .with({ type: "WSEventGraphElementsChanged" }, (e) => {
            setGraphElements(e.elements);
          })
          .with({ type: "WSEventGraphTableChanged" }, (e) => {
            setGraphTable(e.table);
          })
          .with({ type: "WSEventCanvasChanged" }, () => {
            /* */
          })
          .with({ type: "WSEventProgress" }, (event) => {
            setProgress(event);
          })
          .with({ type: "WSEventClearProgress" }, () => {
            clearProgress();
          })
          .with({ type: "WSEventNodesMoved" }, (event) => {
            setPerformance(event.performance);
          })
          .with({ type: "WSEventNotification" }, (event) => {
            const notification = event.notification;
            pushNotification({
              message: notification.message,
              date: new Date(notification.date),
              severity: notification.severity,
            });
          })
          .with({ type: "WSEventSetNodeLocks" }, () => {
            /* */
          })
          .with({ type: "WSEventKick" }, () => {
            void navigate("/");
          })
          .with({ type: "WSEventCanvasDataReady" }, (event) => {
            setGraphMetaData(event.metaData);
            setGraphElements(event.elements);
            setGraphTable(event.table);
          })
          .exhaustive();
      }),
    ];

    return () => {
      webSockets.sendMessage({
        type: "WSActionLeaveCanvas",
      } satisfies WSActionLeaveCanvas);

      subscriptions.forEach((s) => {
        s.unsubscribe();
      });
      setGraph(null);
      setPerformance(null);
      clearProgress();
    };
  }, []);

  return (
    <>
      <Stack style={{ height: "100%" }} className={"position-relative"}>
        <Stack>
          <AppNavbar
            left={
              <>
                <Stack direction={"horizontal"} gap={1}>
                  <Stack direction={"horizontal"}>
                    <ActionNavbarButton
                      action={CloseRoomAction.shared}
                      params={{ navigate }}
                      hideTitle={true}
                    ></ActionNavbarButton>
                    <NavbarLogo></NavbarLogo>
                  </Stack>
                  <MenuBar
                    context={props.context}
                    roomContext={roomContext}
                  ></MenuBar>
                </Stack>
              </>
            }
            center={null}
            right={null}
          ></AppNavbar>
          <Stack
            direction={"horizontal"}
            className={"align-items-stretch flex-grow-1 position-relative"}
            style={{ height: "100px" }}
          >
            <Stack className={"bg-body-tertiary border-end flex-grow-0 z-1"}>
              <ScenariosPanelButton></ScenariosPanelButton>
              <QueryPanelButton></QueryPanelButton>
              <NotesPanelButton></NotesPanelButton>
              <SearchPanelButton></SearchPanelButton>
            </Stack>
            {leftPanel === "scenarios" && (
              <ScenariosPanel
                context={props.context}
                roomContext={roomContext}
              ></ScenariosPanel>
            )}
            {leftPanel === "query" && (
              <QueryPanel roomContext={roomContext}></QueryPanel>
            )}
            {leftPanel === "notes" && (
              <NotesPanel
                roomContext={roomContext}
                context={props.context}
              ></NotesPanel>
            )}
            {leftPanel === "search" && (
              <SearchPanel roomContext={roomContext}></SearchPanel>
            )}
            <Canvas context={props.context} roomContext={roomContext}></Canvas>
            {rightPanel === "inspector" && (
              <InspectorPanel
                context={props.context}
                roomContext={roomContext}
              ></InspectorPanel>
            )}
            {rightPanel === "histogram" && (
              <HistogramPanel roomContext={roomContext}></HistogramPanel>
            )}
            {rightPanel === "visualization" && (
              <VisualizationPanel
                roomContext={roomContext}
              ></VisualizationPanel>
            )}
            <Stack className={"flex-grow-0 bg-body-tertiary border-start z-1"}>
              <InspectorPanelButton></InspectorPanelButton>
              <HistogramPanelButton></HistogramPanelButton>
              <VisualizationPanelButton></VisualizationPanelButton>
            </Stack>
            <ToastStack></ToastStack>
            <RunScenarioModal roomContext={roomContext}></RunScenarioModal>
            <ExpandNodePreviewModal
              roomContext={roomContext}
            ></ExpandNodePreviewModal>
            <AddEditNoteModal roomContext={roomContext}></AddEditNoteModal>
          </Stack>
          <StatusBar
            left={<ProgressDisplay></ProgressDisplay>}
            right={
              <>
                <PerformanceDisplay></PerformanceDisplay>
                <AuthButton></AuthButton>
                <SocketStateDisplay></SocketStateDisplay>
              </>
            }
          ></StatusBar>
          {socketState.type !== "connected" && (
            <ReconnectOverlay></ReconnectOverlay>
          )}
        </Stack>
        <GraphRendererD3
          context={props.context}
          roomContext={roomContext}
        ></GraphRendererD3>
      </Stack>
    </>
  );
}
