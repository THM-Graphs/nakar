import { Badge, Container, Image, Nav, Navbar } from "react-bootstrap";
import clsx from "clsx";
import { ThemeDropdown } from "./ThemeDropdown.tsx";
import { useStore } from "../lib/state/useStore.ts";
import { useActionRunner } from "../lib/actions/useActionRunner.ts";
import { toggleWindow } from "../lib/actions/toggleWindow.ts";
import { toggleDataWindow } from "../lib/actions/toggleDataWindow.ts";
import { useContext } from "react";
import { BackendContext } from "../lib/backend/BackendContext.ts";

export function AppNavbar() {
  const scenarioWindowOpen = useStore((state) => state.scenariosWindow.opened);
  const tableDataOpened = useStore((state) => state.canvas.tableDataOpened);
  const tableData = useStore((state) => state.canvas.graph.tableData);
  const actionRunner = useActionRunner();
  const backend = useContext(BackendContext);

  return (
    <Navbar
      className="bg-body-tertiary"
      style={{
        zIndex: 600,
      }}
    >
      <Container fluid>
        <Navbar.Brand className={"me-5"}>
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
        <Nav.Link
          onClick={actionRunner(toggleWindow())}
          className={clsx("me-auto", scenarioWindowOpen && "fw-bold")}
        >
          <i className={"bi bi-easel-fill me-2"}></i>
          <span>Scenarios</span>
        </Nav.Link>
        <ThemeDropdown></ThemeDropdown>
        {tableData.length > 0 && (
          <Nav.Link
            onClick={actionRunner(toggleDataWindow())}
            className={clsx("ms-5", tableDataOpened && "fw-bold")}
          >
            <i className={"bi bi-table me-2"}></i>
            {tableData.length > 0 && (
              <Badge className={"me-2"} bg="secondary">
                {tableData.length}
              </Badge>
            )}
            <span>Data</span>
          </Nav.Link>
        )}
        <Nav.Link
          href={backend.getBaseUrl()}
          className={"ms-5"}
          target={"_blank"}
        >
          <Badge bg="secondary">{backend.getBaseUrl()}</Badge>
        </Nav.Link>
        <Badge bg="danger" className={"ms-2"}>
          {import.meta.env.DEV && <span>{import.meta.env.MODE}</span>}
        </Badge>
      </Container>
    </Navbar>
  );
}
