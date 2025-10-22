import { Dropdown } from "react-bootstrap";
import { AppContext } from "../../state/AppContext.ts";

export function ClientInfoDropdownEntry(props: { context: AppContext }) {
  return (
    <>
      <Dropdown.Item disabled className={"small"}>
        Client ({props.context.env.VERSION})
      </Dropdown.Item>
      <Dropdown.Item disabled className={"small"}>
        Mode: {import.meta.env.MODE}
      </Dropdown.Item>
      <Dropdown.Divider />
    </>
  );
}
