import { Nav, Stack } from "react-bootstrap";
import { MainMenuEntry } from "./MainMenuEntry.tsx";
import { MenuEntrySeperator } from "./MenuEntrySeperator.tsx";

export function MainMenu() {
  return (
    <Nav
      variant={"pills"}
      style={{ width: "300px" }}
      className={"p-3 border-end shadow-sm flex-shrink-0 flex-grow-0"}
    >
      <Stack>
        <MainMenuEntry
          title={"Home"}
          targetUrl={"/"}
          icon={"house-fill"}
        ></MainMenuEntry>
        <MenuEntrySeperator></MenuEntrySeperator>
        <MainMenuEntry
          title={"Database Definitions"}
          targetUrl={"/database-definitions"}
          icon={"database-fill"}
        ></MainMenuEntry>
        <MainMenuEntry
          title={"Scenarios"}
          targetUrl={"/scenarios"}
          icon={"easel-fill"}
        ></MainMenuEntry>
      </Stack>
    </Nav>
  );
}
