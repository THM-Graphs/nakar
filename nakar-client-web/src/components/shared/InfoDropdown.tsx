import { Dropdown, Stack } from "react-bootstrap";
import { ThemeDropdownEntries } from "./ThemeDropdownEntry";
import { AppContext } from "../../lib/state/AppContext.ts";
import { DropdownButton } from "./DropdownButton.tsx";
import { ClientInfoDropdownEntry } from "./ClientInfoDropdownEntry.tsx";
import { ServerInfoDropdownEntry } from "./ServerInfoDropdownEntry.tsx";

export function InfoDropdown(props: { context: AppContext }) {
  return (
    <>
      <DropdownButton icon={"gear-fill"}>
        <Dropdown.Header>Theme</Dropdown.Header>
        <ThemeDropdownEntries></ThemeDropdownEntries>
        <Dropdown.Divider></Dropdown.Divider>
        <ClientInfoDropdownEntry
          context={props.context}
        ></ClientInfoDropdownEntry>
        <ServerInfoDropdownEntry
          context={props.context}
        ></ServerInfoDropdownEntry>

        <Dropdown.Item
          href={props.context.env.BACKEND_URL + "/system/backup"}
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
