import {Badge, Container, Image, Nav, Navbar} from "react-bootstrap";
import {useBearStore} from "../lib/State.ts";
import {baseUrl} from "../lib/Backend.ts";
import clsx from "clsx";

export function AppNavbar() {
  const opened = useBearStore((state) => state.scenariosWindow.opened);
  const toggleWindow = useBearStore((state) => state.scenariosWindow.toggleWindow);

  return (
    <Navbar className="bg-body-tertiary">
      <Container fluid>
        <Navbar.Brand className={"me-5"}>
          <Image alt="" src="/logo.png" width="30" height="30" roundedCircle className={"me-2"} />
          NAKAR
        </Navbar.Brand>
        <Nav.Link onClick={toggleWindow} className={clsx("me-auto", opened && "text-muted")} disabled={opened}><i className={"bi bi-easel-fill me-1"}></i> Scenarios</Nav.Link>
        <Nav.Link href={baseUrl()} target={"_blank"}><Badge bg="secondary">{baseUrl()}</Badge></Nav.Link>
      </Container>
    </Navbar>
  );
}
