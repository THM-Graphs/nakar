import { Image, Stack } from "react-bootstrap";
import { ScenarioWindowButton } from "../room/ScenarioWindowButton.tsx";
import { BackButton } from "./BackButton.tsx";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";
import { SocketStateDisplay } from "../room/SocketStateDisplay.tsx";
import { SocketState } from "../../lib/ws/SocketState.ts";
import { Env } from "../../lib/env/env.ts";
import { InfoDropdown } from "./InfoDropdown.tsx";
import { WebSocketsManager } from "../../lib/ws/WebSocketsManager.ts";
import clsx from "clsx";

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
      className="bg-body-tertiary border-bottom"
      style={{
        zIndex: 600,
        height: "30px",
      }}
    >
      <Stack
        direction={"horizontal"}
        className={"justify-content-between"}
        style={{ width: "100%" }}
      >
        <Stack direction={"horizontal"} gap={2}>
          <BackButton
            hidden={!props.showBackButton}
            href={"/"}
            title={props.room?.title}
          ></BackButton>
          <Stack direction={"horizontal"} className={"ps-1 pe-1"}>
            <Image
              alt=""
              src="/logo.png"
              width="20"
              height="20"
              roundedCircle
              className={"me-1"}
            />
            <span className={"small fw-bold"}>NAKAR</span>
          </Stack>
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
        <Stack direction={"horizontal"} className={"align-items-stretch"}>
          <InfoDropdown
            env={props.env}
            renderer={props.renderer}
          ></InfoDropdown>
          {props.room && (
            <SocketStateDisplay
              socketState={props.room.socketState}
            ></SocketStateDisplay>
          )}
        </Stack>
      </Stack>
    </Stack>
  );
}
