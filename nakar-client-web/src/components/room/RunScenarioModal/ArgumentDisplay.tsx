import { Scenario, ScenarioArgument } from "../../../../src-gen";
import { useBearStore } from "../../../lib/state/useBearStore.ts";
import { useClipboard } from "../../../lib/clipboard/useClipboard.ts";
import { Form, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { NavbarButton } from "../../shared/NavbarButton.tsx";

export function ArgumentDisplay(props: {
  scenario: Scenario;
  arg: ScenarioArgument;
  autoFocus?: boolean;
}) {
  const setArgumentValue = useBearStore(
    (s) => s.room.scenario.runScenarioModal.setArgumentValue,
  );
  const [clipboardEnabled, , readClipboard] = useClipboard();

  const parameter = props.scenario.parameters.find(
    (p) => p.identifier === props.arg.identifier,
  );

  const parameterTitle = parameter?.title ?? props.arg.identifier;

  return (
    <Form.Group key={props.arg.identifier}>
      <Stack
        direction={"horizontal"}
        className={"bg-body border-top border-bottom align-items-stretch ps-2"}
      >
        <OverlayTrigger overlay={<Tooltip>${props.arg.identifier}</Tooltip>}>
          <Form.Label
            style={{ width: "150px" }}
            className={"mb-0 d-flex align-items-center pt-1 pb-1"}
          >
            <span className={"small"}>{parameterTitle}</span>
          </Form.Label>
        </OverlayTrigger>
        <Form.Control
          type="text"
          placeholder={"Enter a value…"}
          size={"sm"}
          value={props.arg.value}
          onChange={(event) => {
            setArgumentValue(props.arg.identifier, event.target.value);
          }}
          className={"rounded-0 border-0 border-start border-end ms-2"}
          autoFocus={props.autoFocus}
        />
        <NavbarButton
          icon={"x-lg"}
          onClick={() => {
            setArgumentValue(props.arg.identifier, "");
          }}
        ></NavbarButton>
        {clipboardEnabled && (
          <OverlayTrigger overlay={<Tooltip>Paste</Tooltip>}>
            <Stack className={"align-self-stretch"} direction={"horizontal"}>
              <NavbarButton
                icon={"clipboard-check"}
                onClick={async () => {
                  setArgumentValue(props.arg.identifier, await readClipboard());
                }}
              ></NavbarButton>
            </Stack>
          </OverlayTrigger>
        )}
      </Stack>
    </Form.Group>
  );
}
