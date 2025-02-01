import { Image, Navbar, Stack } from "react-bootstrap";
import { ThemeDropdown } from "./ThemeDropdown.tsx";
import { ScenarioWindowButton } from "../room/ScenarioWindowButton.tsx";
import { TableDataWindowButton } from "../room/TableDataWindowButton.tsx";
import { BackendBadge } from "./BackendBadge.tsx";
import { DevelopmentIndicatorBadge } from "./DevelopmentIndicatorBadge.tsx";
import { VersionBadge } from "./VersionBadge.tsx";
import { BackButton } from "./BackButton.tsx";
import { RendererDropdown } from "../room/RendererDropdown.tsx";
import { GraphRendererEngine } from "../../lib/graph-renderer/GraphRendererEngine.ts";
import { SocketStateDisplay } from "../room/SocketStateDisplay.tsx";
import { SocketState } from "../../lib/ws/SocketState.ts";
import { Env } from "../../lib/env/env.ts";

export function AppNavbar(props: {
  scenarioWindow?: {
    isOpen: boolean;
    onToggle: () => void;
  };
  tableDataWindow?: {
    rowCount: number;
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
          title={"Back to Room List"}
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
        {props.renderer && (
          <RendererDropdown
            current={props.renderer.current}
            onChange={props.renderer.onChange}
          ></RendererDropdown>
        )}
        <ThemeDropdown></ThemeDropdown>
        {props.tableDataWindow && (
          <TableDataWindowButton
            onToggle={props.tableDataWindow.onToggle}
            rowCount={props.tableDataWindow.rowCount}
            isOpen={props.tableDataWindow.isOpen}
          ></TableDataWindowButton>
        )}
        <Stack direction={"horizontal"} gap={2}>
          <BackendBadge env={props.env}></BackendBadge>
          <VersionBadge env={props.env}></VersionBadge>
          <DevelopmentIndicatorBadge></DevelopmentIndicatorBadge>
        </Stack>
      </Stack>
    </Navbar>
  );
}
