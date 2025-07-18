import { Dropdown, Stack } from "react-bootstrap";
import { useBearStore } from "../../lib/state/useBearStore.ts";
import { RoomContext } from "../../pages/Room.tsx";
import { PropertyMenuScenarioGroupEntry } from "./PropertyMenuScenarioGroupEntry.tsx";
import { useClipboard } from "../../lib/clipboard/useClipboard.ts";
import { DropdownButton } from "../shared/DropdownButton.tsx";

export function PropertyMenu(props: {
  value: unknown;
  roomContext: RoomContext;
  buttonSize?: "sm";
}) {
  const [isClipboardEnabled, setClipboard] = useClipboard();
  const parameterizedScenarios = useBearStore(
    (s) => s.room.panels.scenarios.scenarios.parameterizedScenarios,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  if (parameterizedScenarios.length === 0) {
    return null;
  }

  return (
    <>
      <DropdownButton
        icon={"three-dots-vertical"}
        buttonSize={props.buttonSize ?? undefined}
        buttonClassName={"align-self-baseline"}
        menuStyle={{ width: "350px" }}
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
        <Dropdown.Divider></Dropdown.Divider>
        <Dropdown.Header>Run Scenario</Dropdown.Header>
        {parameterizedScenarios.map((scenarioGroup) => (
          <PropertyMenuScenarioGroupEntry
            scenarioGroup={scenarioGroup}
            roomContext={props.roomContext}
            value={props.value}
            key={scenarioGroup.id}
          ></PropertyMenuScenarioGroupEntry>
        ))}
      </DropdownButton>
    </>
  );
}
