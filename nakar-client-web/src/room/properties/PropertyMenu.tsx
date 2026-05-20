import { Dropdown, Stack } from "react-bootstrap";
import { useBearStore } from "../../state/useBearStore.ts";
import { useClipboard } from "../../shared/clipboard/useClipboard.ts";
import { DropdownButton } from "../../shared/elements/DropdownButton.tsx";
import { DetailPaneAction } from "../inspector-panel/DetailPaneAction.ts";
import { formatActionShortcut } from "../actions/actionShortcutLabel.ts";

export function PropertyMenu(props: {
  value: unknown;
  buttonSize?: "sm";
  customActions?: DetailPaneAction[];
}) {
  const [isClipboardEnabled, setClipboard] = useClipboard();
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  return (
    <>
      <DropdownButton
        icon={"three-dots-vertical"}
        buttonSize={props.buttonSize ?? undefined}
        containerClassName={"align-self-baseline"}
        menuStyle={{ width: "350px" }}
        align={"end"}
        drop={"end"}
      >
        <Dropdown.Item
          className={"small"}
          disabled={!isClipboardEnabled}
          onClick={() => {
            (async () => {
              try {
                await setClipboard(
                  typeof props.value == "string"
                    ? props.value
                    : JSON.stringify(props.value),
                );
              } catch (error) {
                pushErrorNotification(error);
              }
            })().catch(pushErrorNotification);
          }}
        >
          <Stack direction={"horizontal"} gap={2}>
            <i className={"bi bi-copy"}></i>
            <span>Copy</span>
          </Stack>
        </Dropdown.Item>
        {props.customActions && (
          <>
            <Dropdown.Divider></Dropdown.Divider>
            {props.customActions.map((action) => (
              <Dropdown.Item
                className={"small"}
                key={action.title}
                disabled={action.disabled}
                onClick={(): void => {
                  Promise.resolve(action.action()).catch((e: unknown) => {
                    pushErrorNotification(e);
                  });
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
                    {action.icon && (
                      <i className={`bi bi-${action.icon} me-1`}></i>
                    )}
                    <span>{action.title}</span>
                  </Stack>
                  {action.shortcut && (
                    <span className={"text-muted small text-nowrap"}>
                      {formatActionShortcut(action.shortcut)}
                    </span>
                  )}
                </Stack>
              </Dropdown.Item>
            ))}
          </>
        )}
      </DropdownButton>
    </>
  );
}
