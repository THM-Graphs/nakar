import { Image, Stack, Tooltip } from "react-bootstrap";
import { ScenarioWindowButton } from "../room/ScenarioWindowButton.tsx";
import { BackButton } from "./BackButton.tsx";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";
import { SocketStateDisplay } from "../room/SocketStateDisplay.tsx";
import { SocketState } from "../../lib/ws/SocketState.ts";
import { Env } from "../../lib/env/env.ts";
import { InfoDropdown } from "./InfoDropdown.tsx";
import { WebSocketsManager } from "../../lib/ws/WebSocketsManager.ts";
import clsx from "clsx";
import { ProgressDisplay } from "../room/ProgressDisplay.tsx";

export function AppNavbar(props: {
  scenarioWindow?: {
    isOpen: boolean;
    onToggle: () => void;
  };
  room?: {
    title: string | null;
    socketState: SocketState;
  };
  showBackButton?: boolean;
  renderer?: {
    current: GraphRendererEngine;
    onChange: (newRenderer: GraphRendererEngine) => void;
  };
  env: Env;
  webSocketsManager?: WebSocketsManager;
  tabs?: {
    state: "graph" | "data";
    setTab: (tab: "graph" | "data") => void;
  };
}) {
  return (
    <Stack
      direction={"horizontal"}
      className="bg-body-tertiary border-bottom justify-content-between position-relative"
      style={{
        zIndex: 600,
        height: "30px",
      }}
    >
      <Stack direction={"horizontal"} gap={3}>
        <BackButton
          hidden={!props.showBackButton}
          href={"/"}
          title={"Rooms"}
        ></BackButton>
        {props.scenarioWindow && (
          <ScenarioWindowButton
            isOpen={props.scenarioWindow.isOpen}
            onToggle={props.scenarioWindow.onToggle}
          ></ScenarioWindowButton>
        )}
        {props.tabs && (
          <Stack direction={"horizontal"}>
            <Stack
              direction={"horizontal"}
              className={clsx(
                "border-start ps-2 pe-2 small text-muted pointer",
                props.tabs.state === "graph" && "bg-body-secondary",
              )}
              onClick={() => {
                props.tabs?.setTab("graph");
              }}
            >
              <i className={clsx("bi-bounding-box-circles me-2")}></i>
              Graph
            </Stack>
            <Stack
              direction={"horizontal"}
              className={clsx(
                "border-start border-end ps-2 pe-2 small text-muted pointer",
                props.tabs.state === "data" && "bg-body-secondary",
              )}
              onClick={() => {
                props.tabs?.setTab("data");
              }}
            >
              <i className={clsx("bi-table me-2")}></i>
              Data
            </Stack>
          </Stack>
        )}
      </Stack>
      <Stack
        direction={"horizontal"}
        className={
          "ps-1 pe-1 position-absolute justify-content-center align-content-center"
        }
        style={{ width: "100%", height: "100%", pointerEvents: "none" }}
      >
        <Image
          alt=""
          src="/logo.png"
          width="20"
          height="20"
          roundedCircle
          className={"me-1"}
        />
        <span className={"small fw-bold"}>NAKAR</span>
        {props.room?.title && (
          <span className={"small text-muted ms-2"}>{props.room.title}</span>
        )}
      </Stack>
      <Stack direction={"horizontal"} className={"align-items-stretch"}>
        {props.webSocketsManager && (
          <ProgressDisplay
            webSocketsManager={props.webSocketsManager}
          ></ProgressDisplay>
        )}
        <InfoDropdown env={props.env} renderer={props.renderer}></InfoDropdown>
        {props.room && (
          <SocketStateDisplay
            socketState={props.room.socketState}
          ></SocketStateDisplay>
        )}
      </Stack>
    </Stack>
  );
}
