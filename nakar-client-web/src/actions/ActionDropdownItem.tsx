import { Action } from "./Action.ts";
import { Dropdown, Stack } from "react-bootstrap";

export function ActionDropdownItem<T>(props: {
  action: Action<T>;
  params: T;
  customTitle?: string;
}) {
  const icon = props.action.icon(props.params);
  return (
    <Dropdown.Item
      className={"small"}
      key={props.action.slug()}
      disabled={props.action.disabled(props.params)}
      onClick={() => {
        props.action.runAsync(props.params);
      }}
    >
      <Stack direction={"horizontal"} gap={1}>
        {icon && <i className={`bi bi-${icon} me-1`}></i>}
        {props.customTitle ?? props.action.title(props.params)}
      </Stack>
    </Dropdown.Item>
  );
}
