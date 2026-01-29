import { Stack } from "react-bootstrap";
import { AppNavbar } from "../shared/bars/AppNavbar.tsx";
import { Context, createContext, useContext, useEffect } from "react";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { resultOrThrow } from "../shared/data/resultOrThrow.ts";
import { ToastStack } from "../shared/bars/ToastStack.tsx";
import { HistogramPanel } from "../room/histogram-panel/HistogramPanel.tsx";
import { ScenariosPanelButton } from "../room/scenarios-panel/ScenariosPanelButton.tsx";
import { SocketStateDisplay } from "../shared/socket/SocketStateDisplay.tsx";
import { ReconnectOverlay } from "../shared/socket/ReconnectOverlay.tsx";
import { NavbarLogo } from "../shared/bars/NavbarLogo.tsx";
import { InspectorPanel } from "../room/inspector-panel/InspectorPanel.tsx";
import { useBearStore } from "../state/useBearStore.ts";
import { ScenariosPanel } from "../room/scenarios-panel/ScenariosPanel.tsx";
import { InspectorPanelButton } from "../room/inspector-panel/InspectorPanelButton.tsx";
import { HistogramPanelButton } from "../room/histogram-panel/HistogramPanelButton.tsx";
import { match } from "ts-pattern";
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
import {
  canvasControllerGetCanvas,
  CanvasDto,
  CanvasPageDto,
  EventWsdto,
  RoomDto,
  ScenarioCollectionDto,
} from "../../src-gen";
import { CanvasToolbar } from "../room/canvas/CanvasToolbar.tsx";
import { GraphDataToggle } from "../room/data-table/GraphDataToggle.tsx";
import { useAppContext } from "../state/AppContextData.ts";
import { Router } from "../routing/Router.ts";

const CanvasContext: Context<CanvasContextData | null> =
  createContext<CanvasContextData | null>(null);

export function useCanvasContext(): CanvasContextData {
  const canvasContext = useContext(CanvasContext);
  if (canvasContext == null) {
    throw new Error("Context Provider Error.");
  }
  return canvasContext;
}

export type CanvasContextData = {
  initialCanvasData: CanvasDto;
  initialScenariosData: ScenarioCollectionDto;
  initialRoomData: RoomDto;
};

export async function CanvasLoader(
  args: LoaderFunctionArgs,
): Promise<CanvasContextData> {
  const canvasId = args.params["id"];

  if (canvasId == null) {
    throw new Error("No canvas id provided.");
  }

  const data: CanvasPageDto = resultOrThrow(
    await canvasControllerGetCanvas({ path: { canvasId: canvasId } }),
  );

  return {
    initialCanvasData: data.canvas,
    initialScenariosData: data.scenarios,
    initialRoomData: data.room,
  };
}

export function CanvasPage() {
  const context = useAppContext();
  const canvasContext: CanvasContextData = useLoaderData();
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
  const webSockets = context.webSocketsManager;
  const setPerformance = useBearStore((s) => s.room.ui.setPerformance);
  const setScenarios = useBearStore(
    (s) => s.room.panels.scenarios.setScenarios,
  );
  const setVisualizationData = useBearStore(
    (s) => s.room.panels.visualization.setData,
  );
  const setHistogram = useBearStore((s) => s.room.scenario.setHistogram);
  const setNotes = useBearStore((s) => s.room.scenario.setNotes);
  const pushNotification = useBearStore((s) => s.room.ui.pushNotification);
  const navigate = useNavigate();
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const rightPanel = useBearStore((s) => s.room.panels.right);

  useEffect(() => {
    webSockets.connect(canvasContext.initialCanvasData.id);
    return () => {
      webSockets.disconnect();
    };
  }, [canvasContext.initialCanvasData.id]);

  useEffect(() => {
    setScenarios(canvasContext.initialScenariosData);
  }, [canvasContext]);

  useEffect(() => {
    if (socketState.type === "connected") {
      clearProgress();
      clearPerformance();
    }
  }, [socketState]);

  useEffect(() => {
    const subscriptions = [
      webSockets.onMessage$.subscribe((message: EventWsdto) => {
        match(message.event)
          .with({ type: "CanvasMetaDataChangedWsdto" }, (event) => {
            setGraphMetaData(event.metaData);
          })
          .with({ type: "CanvasElementsChangedWsdto" }, (e) => {
            setGraphElements(e.elements);
          })
          .with({ type: "CanvasTableDataChangedWsdto" }, (e) => {
            setGraphTable(e.table);
          })
          .with({ type: "CanvasChangedWsdto" }, () => {
            /* */
          })
          .with({ type: "ProgressWsdto" }, (event) => {
            setProgress(event);
          })
          .with({ type: "ClearProgressWsdto" }, () => {
            clearProgress();
          })
          .with({ type: "NodesMovedWsdto" }, (event) => {
            setPerformance(event.performance);
          })
          .with({ type: "NotificationWsdto" }, (event) => {
            const notification = event.notification;
            pushNotification({
              message: notification.message,
              date: new Date(notification.date),
              severity: notification.severity,
            });
          })
          .with({ type: "SetNodeLocksWsdto" }, () => {
            /* */
          })
          .with({ type: "KickWsdto" }, () => {
            void navigate(Router.getHomeUrl());
          })
          .with({ type: "CanvasDataReadyWsdto" }, (event) => {
            setGraph(event.data);
          })
          .with({ type: "CanvasViewSettingsChangedWsdto" }, (event) => {
            setVisualizationData(event.viewSettings);
          })
          .with({ type: "CanvasHistogramChangedWsdto" }, (event) => {
            setHistogram(event.histogram);
          })
          .with({ type: "CanvasNotesChangedWsdto" }, (event) => {
            setNotes(event.notes);
          })
          .with({ type: "CursorMovedWsdto" }, () => {
            /* */
          })
          .exhaustive();
      }),
    ];

    return () => {
      subscriptions.forEach((s) => {
        s.unsubscribe();
      });
      setPerformance(null);
      clearProgress();
    };
  }, [webSockets]);

  return (
    <CanvasContext.Provider value={canvasContext}>
      <Stack style={{ height: "100%" }} className={"position-relative bg-body"}>
        <Stack gap={1} className={"pb-3"}>
          <Stack className="flex-grow-0 flex-shrink-0">
            <AppNavbar
              left={
                <>
                  <Stack direction={"horizontal"} gap={1}>
                    <Stack direction={"horizontal"}>
                      <ActionNavbarButton
                        action={CloseRoomAction.shared}
                        params={{ navigate }}
                        hideTitle={true}
                        hideIcon={true}
                      >
                        <NavbarLogo></NavbarLogo>
                      </ActionNavbarButton>
                    </Stack>
                    <MenuBar></MenuBar>
                  </Stack>
                </>
              }
              center={null}
              right={
                <>
                  <AuthButton></AuthButton>
                  <SocketStateDisplay></SocketStateDisplay>
                </>
              }
              className=""
            ></AppNavbar>
            <CanvasToolbar
              className={"border-bottom bg-body-tertiary shadow-sm"}
            ></CanvasToolbar>
          </Stack>
          <Stack
            direction={"horizontal"}
            className={"align-items-start flex-grow-1 position-relative"}
            style={{ height: "100px" }}
            gap={1}
          >
            <Stack
              direction={"vertical"}
              className={
                "bg-body-tertiary border border-start-0 flex-grow-0 flex-shrink-0 z-1 rounded-end align-self-start shadow-sm"
              }
            >
              <ScenariosPanelButton
                className={"rounded-top-end"}
              ></ScenariosPanelButton>
              <QueryPanelButton></QueryPanelButton>
              <NotesPanelButton></NotesPanelButton>
              <SearchPanelButton
                className={"rounded-bottom-end"}
              ></SearchPanelButton>
            </Stack>
            <Stack className={"flex-grow-0 flex-shrink-0"}>
              {leftPanel === "scenarios" && <ScenariosPanel></ScenariosPanel>}
              {leftPanel === "query" && <QueryPanel></QueryPanel>}
              {leftPanel === "notes" && <NotesPanel></NotesPanel>}
              {leftPanel === "search" && <SearchPanel></SearchPanel>}
            </Stack>
            <Canvas></Canvas>
            <Stack className={"flex-grow-0 flex-shrink-0"}>
              {rightPanel === "inspector" && <InspectorPanel></InspectorPanel>}
              {rightPanel === "histogram" && <HistogramPanel></HistogramPanel>}
              {rightPanel === "visualization" && (
                <VisualizationPanel></VisualizationPanel>
              )}
            </Stack>
            <Stack
              className={"align-self-start flex-grow-0 flex-shrink-0"}
              gap={1}
            >
              <GraphDataToggle className={"shadow-sm"}></GraphDataToggle>
              <Stack
                direction="vertical"
                className={
                  "bg-body-tertiary border border-end-0 z-1 rounded-start shadow-sm"
                }
              >
                <InspectorPanelButton
                  className={"rounded-top-start"}
                ></InspectorPanelButton>
                <HistogramPanelButton></HistogramPanelButton>
                <VisualizationPanelButton
                  className={"rounded-bottom-start"}
                ></VisualizationPanelButton>
              </Stack>
            </Stack>
          </Stack>

          {socketState.type !== "connected" && (
            <ReconnectOverlay></ReconnectOverlay>
          )}
        </Stack>
        <GraphRendererD3></GraphRendererD3>
        <ToastStack></ToastStack>
        <RunScenarioModal></RunScenarioModal>
        <ExpandNodePreviewModal></ExpandNodePreviewModal>
        <AddEditNoteModal></AddEditNoteModal>
      </Stack>
    </CanvasContext.Provider>
  );
}
