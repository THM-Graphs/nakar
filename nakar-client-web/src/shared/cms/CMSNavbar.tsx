import { NavbarLogo } from "../bars/NavbarLogo.tsx";
import {
  Breadcrumb,
  Container,
  Dropdown,
  Navbar,
  NavDropdown,
  Stack,
} from "react-bootstrap";
import { ThemeDropdownEntries } from "../bars/ThemeDropdownEntry.tsx";
import { ClientInfoDropdownEntry } from "../bars/ClientInfoDropdownEntry.tsx";
import { ServerInfoDropdownEntry } from "../bars/ServerInfoDropdownEntry.tsx";
import { useAppContext } from "../../state/AppContextData.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { match, P } from "ts-pattern";
import { useNavigate } from "react-router";

export function CMSNavbar(props: {
  breadcrumbContext: { title: string; url: string }[];
}) {
  const context = useAppContext();
  const username = useBearStore((s) => s.global.auth.username);
  const showLoginWindow = useBearStore((s) => s.global.auth.loginWindow.show);
  const navigate = useNavigate();

  return (
    <Navbar className={"bg-body border-bottom shadow-sm z-1 sticky-top"}>
      <Container>
        <Stack
          direction={"horizontal"}
          className={"align-items-center"}
          gap={3}
        >
          <Navbar.Brand href={"/"}>
            <NavbarLogo></NavbarLogo>
          </Navbar.Brand>
          {props.breadcrumbContext.length > 0 && (
            <Breadcrumb>
              {props.breadcrumbContext.map((entry) => (
                <Breadcrumb.Item
                  className={"small"}
                  href={entry.url}
                  key={entry.url + entry.title}
                  onClick={(e) => {
                    e.preventDefault();
                    void navigate((e.target as HTMLAnchorElement).href);
                  }}
                >
                  {entry.title}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          )}
        </Stack>

        <Stack direction={"horizontal"} gap={5}>
          <NavDropdown
            align={"end"}
            title={match(username)
              .with(P.nullish, () => <i className={"bi bi-person"}></i>)
              .with(P.string, (user) => (
                <>
                  <i className={"bi bi-person-fill me-1"}></i>
                  <span className={"small"}>{user}</span>
                </>
              ))
              .exhaustive()}
          >
            {username ? (
              <NavDropdown.Item
                onClick={() => {
                  context.logout(navigate);
                }}
              >
                <span className={"small"}>Logout</span>
              </NavDropdown.Item>
            ) : (
              <NavDropdown.Item onClick={showLoginWindow}>
                <span className={"small"}>Login</span>
              </NavDropdown.Item>
            )}
          </NavDropdown>
          <NavDropdown
            title={<i className={"bi bi-gear-fill"}></i>}
            align={"end"}
          >
            <Dropdown.Header>Theme</Dropdown.Header>
            <ThemeDropdownEntries></ThemeDropdownEntries>
            <Dropdown.Divider></Dropdown.Divider>
            <ClientInfoDropdownEntry></ClientInfoDropdownEntry>
            <ServerInfoDropdownEntry></ServerInfoDropdownEntry>
            <Dropdown.Item
              href={context.env.BACKEND_URL + "/system/backup"}
              target={"_blank"}
              className={"small"}
            >
              <Stack gap={2} direction={"horizontal"}>
                <i className="bi bi-download"></i>
                <span>Download Backup (.tar.gz)</span>
              </Stack>
            </Dropdown.Item>
          </NavDropdown>
        </Stack>
      </Container>
    </Navbar>
  );
}
