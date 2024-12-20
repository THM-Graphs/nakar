import { Navbar, Stack, Image } from "react-bootstrap";
import { ThemeDropdown } from "./ThemeDropdown.tsx";

export function MainNavbar() {
  return (
    <Navbar
      className={"ps-3 pe-3 shadow-sm border-bottom justify-content-between"}
    >
      <Navbar.Brand>
        <Stack direction={"horizontal"} gap={2}>
          <Image alt="" src="/logo.png" width="30" height="30" roundedCircle />
          <span className={"fw-semibold"}>NAKAR</span>
          <span>Admin Dashboard</span>
        </Stack>
      </Navbar.Brand>
      <ThemeDropdown></ThemeDropdown>
    </Navbar>
  );
}
