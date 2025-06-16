import { Stack } from "react-bootstrap";
import { AppNavbar } from "../components/shared/AppNavbar.tsx";
import { Canvas } from "../components/room/Canvas/Canvas.tsx";
import { useEffect } from "react";
import {
  Databases,
  getRoom,
  getScenarios,
  Room as RoomSchema,
  WSActionGetGraph,
  WSActionLeaveRoom,
} from "../../src-gen";
import { LoaderFunctionArgs, useLoaderData } from "react-router";
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

export type RoomLoaderResult = {
  room: RoomSchema;
  scenarios: Databases;
};

export async function RoomLoader(
  args: LoaderFunctionArgs,
): Promise<RoomLoaderResult> {
  const roomId = args.params["id"];

  if (roomId == null) {
    throw new Error("No room id provided.");
  }

  const room = resultOrThrow(await getRoom({ path: { id: roomId } }));
  const scenarios = resultOrThrow(await getScenarios());
  return {
    room: room,
    scenarios: scenarios,
  };
}

export function Room(props: { context: AppContext }) {
  const loaderData: RoomLoaderResult = useLoaderData();
  const scenario = useBearStore((s) => s.room.scenario);
  const socketState = useBearStore((s) => s.room.websockets.state);
  const unlockUI = useBearStore((s) => s.room.ui.unlock);
  const lockUI = useBearStore((s) => s.room.ui.lock);
  const setProgress = useBearStore((s) => s.room.ui.setProgress);
  const clearProgress = useBearStore((s) => s.room.ui.clearProgress);
  const webSockets = props.context.webSocketsManager;
  const setGraph = useBearStore((s) => s.room.scenario.setGraph);
  const setPerformance = useBearStore((s) => s.room.ui.setPerformance);
  const setScenarios = useBearStore(
    (s) => s.room.panels.scenarios.setScenarios,
  );

  useEffect(() => {
    setScenarios(loaderData.scenarios);
  }, [loaderData.scenarios]);

  useEffect(() => {
    if (socketState.type === "connected") {
      webSockets.sendMessage({
        type: "WSActionJoinRoom",
        roomId: loaderData.room.id,
      });
    }
  }, [socketState]);

  useEffect(() => {
    const subscriptions = [
      webSockets.onMessage$.subscribe((message) => {
        match(message)
          .with({ type: "WSEventGraphChanged" }, (event) => {
            scenario.setGraph(event.graph);
          })
          .with({ type: "WSEventRoomChanged" }, (event) => {
            if (event.roomId != null) {
              webSockets.sendMessage({
                type: "WSActionGetGraph",
              } satisfies WSActionGetGraph);
            }
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
          });
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
        nodes: [],
        edges: [],
        metaData: {
          scenarioInfo: null,
          histogram: {
            edgeProperties: [],
            edgeTypes: [],
            nodeLabels: [],
            nodeProperties: [],
          },
          labels: [],
          pipelineSummary: [],
        },
        tableData: [],
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
              <span className={"small text-muted align-self-center ms-2"}>
                {loaderData.room.title}
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
          <ScenariosPanel context={props.context}></ScenariosPanel>
          <Canvas context={props.context}></Canvas>
          <InspectorPanel context={props.context}></InspectorPanel>
          <HistogramPanel></HistogramPanel>
          <ToastStack context={props.context}></ToastStack>
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
