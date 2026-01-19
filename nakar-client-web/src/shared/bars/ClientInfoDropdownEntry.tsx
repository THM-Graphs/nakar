import { Dropdown } from "react-bootstrap";
import { useAppContext } from "../../state/AppContextData.ts";

export function ClientInfoDropdownEntry() {
  const context = useAppContext();

  return (
    <>
      <Dropdown.Item disabled className={"small"}>
        Client ({context.env.VERSION})
      </Dropdown.Item>
      <Dropdown.Item disabled className={"small"}>
        Mode: {import.meta.env.MODE}
      </Dropdown.Item>
      <Dropdown.Divider />
    </>
  );
}
