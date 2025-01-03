import { Badge, Container, Image, Nav, Navbar } from "react-bootstrap";
import clsx from "clsx";
import { ThemeDropdown } from "../room/ThemeDropdown.tsx";
import { env } from "../../lib/env/env.ts";

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
      <Container fluid>
        {props.showBackButton && (
          <Nav.Link className={"me-3 fw-bold"} href={"/"}>
            <i className={"bi bi-chevron-left me-2"}></i>
            <span>Back to Roomlist</span>
          </Nav.Link>
        )}
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
        {props.scenarioWindowOpen != null && (
          <Nav.Link
            onClick={() => {
              props.toggleScenarioWindow?.();
            }}
            className={clsx(props.scenarioWindowOpen && "fw-bold")}
          >
            <i className={"bi bi-easel-fill me-2"}></i>
            <span>Scenarios</span>
          </Nav.Link>
        )}
        <div className={"me-auto"}></div>
        {props.roomTitle && <span>{props.roomTitle}</span>}
        <div className={"me-auto"}></div>
        <ThemeDropdown></ThemeDropdown>
        {props.tableDataLength != null && props.tableDataLength > 0 && (
          <Nav.Link
            onClick={() => {
              props.toggleTableData?.();
            }}
            className={clsx("ms-5", props.tableDataOpened && "fw-bold")}
          >
            <i className={"bi bi-table me-2"}></i>
            {props.tableDataLength > 0 && (
              <Badge className={"me-2"} bg="secondary">
                {props.tableDataLength}
              </Badge>
            )}
            <span>Data</span>
          </Nav.Link>
        )}
        <Nav.Link href={env().BACKEND_URL} className={"ms-5"} target={"_blank"}>
          <Badge bg="secondary">{env().BACKEND_URL}</Badge>
        </Nav.Link>
        <Badge bg="danger" className={"ms-2"}>
          {import.meta.env.DEV && <span>{import.meta.env.MODE}</span>}
        </Badge>
      </Container>
    </Navbar>
  );
}
