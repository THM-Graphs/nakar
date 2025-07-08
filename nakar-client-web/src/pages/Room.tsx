import { Stack } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Canvas } from "../components/room/Canvas/Canvas.tsx";
import { useEffect } from "react";
import {
  Databases,
  getRoom,
  getRoomGraph,
  getScenarios,
  Graph,
  Room as RoomSchema,
  WSActionLeaveRoom,
  WSEventPresentExpandNodePreview,
} from "../../src-gen";
import {
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  useNavigation,
} from "react-router";
import { resultOrThrow } from "../lib/data/resultOrThrow.ts";
import { ToastStack } from "../components/room/ToastStack.tsx";
import { HistogramPanel } from "../components/room/Panel/Histogram/HistogramPanel.tsx";
import { BackButton } from "../components/shared/BackButton.tsx";
import { ScenariosPanelButton } from "../components/room/Panel/Scenarios/ScenariosPanelButton.tsx";
import { ProgressDisplay } from "../components/room/ProgressDisplay.tsx";
import { SocketStateDisplay } from "../components/room/SocketStateDisplay.tsx";
import { InfoDropdown } from "../components/shared/InfoDropdown.tsx";
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

export type RoomContext = {
  initialRoomData: RoomSchema;
  initialScenariosData: Databases;
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
  const scenarios = resultOrThrow(await getScenarios());
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
  const showExpandNodePreview = useBearStore(
    (s) => s.room.scenario.expandNodePreview.open,
  );

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
              title: notification.title,
              severity: notification.severity,
            });
          })
          .with({ type: "WSEventSetNodeLocks" }, () => {
            /* */
          })
          .with({ type: "WSEventKick" }, () => {
            void navigate("/");
          })
          .with(
            { type: "WSEventPresentExpandNodePreview" },
            (event: WSEventPresentExpandNodePreview) => {
              showExpandNodePreview({
                relationships: event.relationships,
                labels: event.labels,
                nodeId: event.nodeId,
              });
            },
          )
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
      setGraph({
        elements: {
          nodes: [],
          edges: [],
          labels: [],
          histogram: {
            edgeProperties: [],
            edgeTypes: [],
            nodeLabels: [],
            nodeProperties: [],
          },
        },
        metaData: {
          scenario: null,
          pipelineSummary: [],
          arguments: [],
        },
        table: {
          data: [],
        },
      });
    };
  }, []);

  return (
    <>
      <Stack style={{ height: "100%" }} className={"position-relative"}>
        <AppNavbar
          left={
            <>
              <BackButton href={"/"} title={"Rooms"}></BackButton>
              <ScenariosPanelButton></ScenariosPanelButton>
            </>
          }
          center={
            <>
              <NavbarLogo></NavbarLogo>
              <span
                className={
                  "small text-muted align-self-center ms-2 user-select-text"
                }
              >
                {roomContext.initialRoomData.title}
              </span>
            </>
          }
          right={
            <>
              <InspectorPanelButton></InspectorPanelButton>
              <HistogramPanelButton></HistogramPanelButton>
              <InfoDropdown context={props.context}></InfoDropdown>
            </>
          }
        ></AppNavbar>
        <Stack
          direction={"horizontal"}
          className={"align-items-stretch flex-grow-1 position-relative"}
          style={{ height: "100px" }}
        >
          <ScenariosPanel
            context={props.context}
            roomContext={roomContext}
          ></ScenariosPanel>
          <Canvas context={props.context} roomContext={roomContext}></Canvas>
          <InspectorPanel
            context={props.context}
            roomContext={roomContext}
          ></InspectorPanel>
          <HistogramPanel roomContext={roomContext}></HistogramPanel>
          <ToastStack></ToastStack>
          <RunScenarioModal roomContext={roomContext}></RunScenarioModal>
          <ExpandNodePreviewModal
            roomContext={roomContext}
          ></ExpandNodePreviewModal>
        </Stack>
        <StatusBar
          left={<ProgressDisplay></ProgressDisplay>}
          right={
            <>
              <PerformanceDisplay></PerformanceDisplay>
              <SocketStateDisplay></SocketStateDisplay>
            </>
          }
        ></StatusBar>
        {socketState.type !== "connected" && (
          <ReconnectOverlay></ReconnectOverlay>
        )}
      </Stack>
    </>
  );
}
