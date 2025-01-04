import { Image, Navbar, Stack } from "react-bootstrap";
import { ThemeDropdown } from "./ThemeDropdown.tsx";
import { ScenarioWindowButton } from "../room/ScenarioWindowButton.tsx";
import { TableDataWindowButton } from "../room/TableDataWindowButton.tsx";
import { BackendBadge } from "./BackendBadge.tsx";
import { DevelopmentIndicatorBadge } from "./DevelopmentIndicatorBadge.tsx";
import { VersionBadge } from "./VersionBadge.tsx";
import { BackButton } from "./BackButton.tsx";

export function AppNavbar(props: {
  scenarioWindowOpen?: boolean;
  toggleScenarioWindow?: () => void;
  tableDataLength?: number;
  tableDataOpened?: boolean;
  toggleTableData?: () => void;
  roomTitle?: string;
  showBackButton?: boolean;
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
        <ScenarioWindowButton
          scenarioWindowOpen={props.scenarioWindowOpen}
          toggleScenarioWindow={props.toggleScenarioWindow}
        ></ScenarioWindowButton>
        <div className={"flex-grow-1"}></div>
        {props.roomTitle && <span>{props.roomTitle}</span>}
        <div className={"flex-grow-1"}></div>
        <ThemeDropdown></ThemeDropdown>
        <TableDataWindowButton
          toggleTableData={props.toggleTableData}
          tableDataLength={props.tableDataLength}
          tableDataOpened={props.tableDataOpened}
        ></TableDataWindowButton>
        <Stack direction={"horizontal"} gap={2}>
          <BackendBadge></BackendBadge>
          <VersionBadge></VersionBadge>
          <DevelopmentIndicatorBadge></DevelopmentIndicatorBadge>
        </Stack>
      </Stack>
    </Navbar>
  );
}
