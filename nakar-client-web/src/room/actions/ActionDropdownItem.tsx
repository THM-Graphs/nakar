import { Action } from "./Action.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { getActionShortcutLabel } from "./actionShortcutLabel.ts";

export function ActionDropdownItem<T>(props: {
  action: Action<T>;
  params: T;
  customTitle?: string;
}) {
  const icon = props.action.icon(props.params);
  const shortcutLabel = getActionShortcutLabel(props.action, props.params);
  return (
    <Dropdown.Item
      className={"small"}
      key={props.action.slug()}
      disabled={props.action.disabled(props.params)}
      onClick={() => {
        props.action.runAsync(props.params);
      }}
    >
      <Stack
        direction={"horizontal"}
        gap={2}
        className={"w-100 justify-content-between align-items-center"}
      >
        <Stack
          direction={"horizontal"}
          gap={1}
          className={"align-items-center"}
        >
          {icon && <i className={`bi bi-${icon} me-1`}></i>}
          <span>{props.customTitle ?? props.action.title(props.params)}</span>
        </Stack>
        {shortcutLabel && (
          <span className={"text-muted small text-nowrap"}>
            {shortcutLabel}
          </span>
        )}
      </Stack>
    </Dropdown.Item>
  );
}
