import { Badge, Container, Image, Nav, Navbar } from "react-bootstrap";
import { actions, useBearStore } from "../lib/State.ts";
import { baseUrl } from "../lib/Backend.ts";
import clsx from "clsx";

export function AppNavbar() {
  const scenarioWindowOpen = useBearStore(
    (state) => state.scenariosWindow.opened,
  );
  const tableDataOpened = useBearStore((state) => state.canvas.tableDataOpened);
  const tableData = useBearStore((state) => state.canvas.graph.tableData);

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
          onClick={actions.scenariosWindow.toggleWindow}
          className={clsx("me-auto", scenarioWindowOpen && "fw-bold")}
        >
          <i className={"bi bi-easel-fill me-2"}></i>
          <span>Scenarios</span>
        </Nav.Link>
        {tableData.length > 0 && (
          <Nav.Link
            onClick={actions.canvas.toggleDataWindow}
            className={clsx("me-5", tableDataOpened && "fw-bold")}
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
        <Nav.Link href={baseUrl()} target={"_blank"}>
          <Badge bg="secondary">{baseUrl()}</Badge>
        </Nav.Link>
      </Container>
    </Navbar>
  );
}
