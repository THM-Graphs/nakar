import { Stack } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Canvas } from "../components/room/Canvas/Canvas.tsx";
import { useEffect } from "react";
import {
  getRoom,
  getRoomGraph,
  getScenarios,
  GetScenariosResult,
  Graph,
  Room as RoomSchema,
  WSActionLeaveRoom,
} from "../../src-gen";
import { LoaderFunctionArgs, useLoaderData, useNavigate } from "react-router";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { ToastStack } from "../components/room/ToastStack.tsx";
import { HistogramPanel } from "../components/room/Panel/Histogram/HistogramPanel.tsx";
import { ScenariosPanelButton } from "../components/room/Panel/Scenarios/ScenariosPanelButton.tsx";
import { ProgressDisplay } from "../components/room/ProgressDisplay.tsx";
import { SocketStateDisplay } from "../components/room/SocketStateDisplay.tsx";
import { ReconnectOverlay } from "../components/room/ReconnectOverlay.tsx";
import { NavbarLogo } from "../components/shared/NavbarLogo.tsx";
import { InspectorPanel } from "../components/room/Panel/Inspector/InspectorPanel.tsx";
import { useBearStore } from "../lib/state/useBearStore.ts";
import { AppContext } from "../lib/state/AppContext.ts";
import { ScenariosPanel } from "../components/room/Panel/Scenarios/ScenariosPanel.tsx";
import { InspectorPanelButton } from "../components/room/Panel/Inspector/InspectorPanelButton.tsx";
import { HistogramPanelButton } from "../components/room/Panel/Histogram/HistogramPanelButton.tsx";
import { StatusBar } from "../components/shared/StatusBar.tsx";
import { match } from "ts-pattern";
import { PerformanceDisplay } from "../components/room/PerformanceDisplay.tsx";
import { RunScenarioModal } from "../components/room/RunScenarioModal/RunScenarioModal.tsx";
import { ExpandNodePreviewModal } from "../components/room/ExpandNodePreviewModal/ExpandNodePreviewModal.tsx";
import { QueryPanel } from "../components/room/Panel/Query/QueryPanel.tsx";
import { QueryPanelButton } from "../components/room/Panel/Query/QueryPanelButton.tsx";
import { GraphRendererD3 } from "../components/room/Canvas/GraphRendererD3.tsx";
import { DropdownButton } from "../components/shared/DropdownButton.tsx";
import { MenuBar } from "../components/room/MenuBar.tsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { CloseRoomAction } from "../actions/CloseRoomAction.ts";
import { ActionDropdownItem } from "../actions/ActionDropdownItem.tsx";
import { EditRoomAction } from "../actions/EditRoomAction.ts";
import { NotesPanel } from "../components/room/Panel/Notes/NotesPanel.tsx";
import { NotesPanelButton } from "../components/room/Panel/Notes/NotesPanelButton.tsx";
import { AddEditNoteModal } from "../components/room/Panel/Notes/AddEditNoteModal.tsx";
import { AuthButton } from "../components/shared/auth/AuthButton.tsx";
import { EditRoomTemplateAction } from "../actions/EditRoomTemplateAction.ts";
import { mapResult } from "../lib/data/mapResult.ts";

export type RoomContext = {
  initialRoomData: RoomSchema;
  initialScenariosData: GetScenariosResult;
  initialGraphData: Graph;
};

export async function RoomLoader(
  args: LoaderFunctionArgs,
): Promise<RoomContext> {
  const roomId = args.params["id"];

  if (roomId == null) {
    throw new Error("No room id provided.");
  }

  const room = resultOrThrow(await getRoom({ path: { id: roomId } }));

  const scenarios = resultOrThrow(
    await getScenarios({ path: { id: room.id } }),
  );
  const graph = resultOrThrow(await getRoomGraph({ path: { id: roomId } }));
  return {
    initialRoomData: room,
    initialScenariosData: scenarios,
    initialGraphData: graph,
  };
}

export function Room(props: { context: AppContext }) {
  const roomContext: RoomContext = useLoaderData();
  const setGraph = useBearStore((s) => s.room.scenario.setGraph);
  const setGraphElements = useBearStore(
    (s) => s.room.scenario.setGraphElements,
  );
  const setGraphMetaData = useBearStore(
    (s) => s.room.scenario.setGraphMetaData,
  );
  const setGraphTable = useBearStore((s) => s.room.scenario.setGraphTable);
  const socketState = useBearStore((s) => s.room.websockets.state);
  const unlockUI = useBearStore((s) => s.room.ui.unlock);
  const lockUI = useBearStore((s) => s.room.ui.lock);
  const setProgress = useBearStore((s) => s.room.ui.setProgress);
  const clearProgress = useBearStore((s) => s.room.ui.clearProgress);
  const webSockets = props.context.webSocketsManager;
  const setPerformance = useBearStore((s) => s.room.ui.setPerformance);
  const setScenarios = useBearStore(
    (s) => s.room.panels.scenarios.setScenarios,
  );
  const pushNotification = useBearStore((s) => s.room.ui.pushNotification);
  const navigate = useNavigate();
  const addMyRoom = useBearStore((s) => s.start.addRoom);

  useEffect(() => {
    addMyRoom(roomContext.initialRoomData.id);
  }, [roomContext.initialRoomData.id]);

  useEffect(() => {
    setScenarios(roomContext.initialScenariosData);
    setGraph(roomContext.initialGraphData);
  }, [roomContext]);

  useEffect(() => {
    if (socketState.type === "connected") {
      webSockets.sendMessage({
        type: "WSActionJoinRoom",
        roomId: roomContext.initialRoomData.id,
      });
      unlockUI();
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
          .with({ type: "WSEventRoomChanged" }, () => {
            /* */
          })
          .with({ type: "WSEventProgress" }, (event) => {
            setProgress(event);
          })
          .with({ type: "WSEventClearProgress" }, () => {
            clearProgress();
          })
          .with({ type: "WSEventLockUi" }, () => {
            lockUI();
          })
          .with({ type: "WSEventUnlockUi" }, () => {
            unlockUI();
          })
          .with({ type: "WSEventPerformanceChanged" }, (event) => {
            setPerformance(event.performance ?? null);
          })
          .with({ type: "WSEventNodesMoved" }, () => {
            /* */
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
          .exhaustive();
      }),
    ];

    return () => {
      webSockets.sendMessage({
        type: "WSActionLeaveRoom",
      } satisfies WSActionLeaveRoom);

      subscriptions.forEach((s) => {
        s.unsubscribe();
      });
      setGraph(null);
      setPerformance(null);
      clearProgress();
      unlockUI();
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
            center={<></>}
            right={
              <>
                <span
                  className={
                    "small text-muted align-self-center ms-2 user-select-text"
                  }
                >
                  {roomContext.initialRoomData.title}
                </span>
                <DropdownButton icon={"three-dots-vertical"}>
                  <ActionDropdownItem
                    action={EditRoomAction.shared}
                    params={{ roomContext: roomContext }}
                  ></ActionDropdownItem>
                  <ActionDropdownItem
                    action={EditRoomTemplateAction.shared}
                    params={{ roomContext: roomContext }}
                  ></ActionDropdownItem>
                </DropdownButton>
              </>
            }
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
            </Stack>
            <ScenariosPanel
              context={props.context}
              roomContext={roomContext}
            ></ScenariosPanel>
            <QueryPanel roomContext={roomContext}></QueryPanel>
            <NotesPanel
              roomContext={roomContext}
              context={props.context}
            ></NotesPanel>
            <Canvas context={props.context} roomContext={roomContext}></Canvas>
            <InspectorPanel
              context={props.context}
              roomContext={roomContext}
            ></InspectorPanel>
            <HistogramPanel roomContext={roomContext}></HistogramPanel>
            <Stack className={"flex-grow-0 bg-body-tertiary border-start z-1"}>
              <InspectorPanelButton></InspectorPanelButton>
              <HistogramPanelButton></HistogramPanelButton>
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
