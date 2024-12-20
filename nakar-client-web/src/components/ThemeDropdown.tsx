import { NavDropdown } from "react-bootstrap";
import { ThemeDropdownItem } from "./ThemeDropdownItem.tsx";

export function ThemeDropdown() {
  return (
    <>
      <NavDropdown
        title={<i className={"bi bi-lightbulb-fill"}></i>}
        drop={"start"}
      >
        <ThemeDropdownItem
          targetTheme={null}
          title={"Auto"}
          icon={"circle-half"}
        ></ThemeDropdownItem>
        <NavDropdown.Divider></NavDropdown.Divider>
        <ThemeDropdownItem
          targetTheme={"light"}
          title={"Light"}
          icon={"lightbulb-fill"}
        ></ThemeDropdownItem>
        <ThemeDropdownItem
          targetTheme={"dark"}
          title={"Dark"}
          icon={"lightbulb-off-fill"}
        ></ThemeDropdownItem>
      </NavDropdown>
    </>
  );
}
