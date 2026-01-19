import { Dropdown, Stack } from "react-bootstrap";
import { ThemeDropdownEntries } from "./ThemeDropdownEntry.tsx";
import { useAppContext } from "../../state/AppContextData.ts";
import { DropdownButton } from "../elements/DropdownButton.tsx";
import { ClientInfoDropdownEntry } from "./ClientInfoDropdownEntry.tsx";
import { ServerInfoDropdownEntry } from "./ServerInfoDropdownEntry.tsx";

export function InfoDropdown() {
  const context = useAppContext();

  return (
    <>
      <DropdownButton icon={"gear-fill"}>
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
      </DropdownButton>
    </>
  );
}
