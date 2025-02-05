import { Image, Navbar, Stack } from "react-bootstrap";
import { ScenarioWindowButton } from "../room/ScenarioWindowButton.tsx";
import { BackButton } from "./BackButton.tsx";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";
import { SocketStateDisplay } from "../room/SocketStateDisplay.tsx";
import { SocketState } from "../../lib/ws/SocketState.ts";
import { Env } from "../../lib/env/env.ts";
import { InfoDropdown } from "./InfoDropdown.tsx";

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
  tableDataWindow?: {
    rowCount: number;
    isOpen: boolean;
    onToggle: () => void;
  };
  env: Env;
}) {
  return (
    <Navbar
      className="bg-body-tertiary"
      style={{
        zIndex: 600,
      }}
    >
      <Stack
        direction={"horizontal"}
        className={"ps-3 pe-3"}
        gap={3}
        style={{ width: "100%" }}
      >
        <BackButton
          hidden={!props.showBackButton}
          href={"/"}
          title={""}
        ></BackButton>
        <Navbar.Brand>
          <Image
            alt=""
            src="/logo.png"
            width="30"
            height="30"
            roundedCircle
            className={"me-2"}
          />
          NAKAR
        </Navbar.Brand>
        {props.scenarioWindow && (
          <ScenarioWindowButton
            isOpen={props.scenarioWindow.isOpen}
            onToggle={props.scenarioWindow.onToggle}
          ></ScenarioWindowButton>
        )}
        <div className={"flex-grow-1"}></div>
        {props.room && <span>{props.room.title}</span>}
        {props.room && (
          <SocketStateDisplay
            socketState={props.room.socketState}
          ></SocketStateDisplay>
        )}
        <div className={"flex-grow-1"}></div>
        <InfoDropdown
          env={props.env}
          renderer={props.renderer}
          tableDataWindow={props.tableDataWindow}
        ></InfoDropdown>
      </Stack>
    </Navbar>
  );
}
