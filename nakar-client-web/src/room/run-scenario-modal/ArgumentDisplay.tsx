import { useBearStore } from "../../state/useBearStore.ts";
import { useClipboard } from "../../shared/clipboard/useClipboard.ts";
import { Form, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import clsx from "clsx";
import { match } from "ts-pattern";
import { DateTool } from "../../shared/data/DateTool.ts";
import { ScenarioArgumentDto, ScenarioDto } from "../../../src-gen";

export function ArgumentDisplay(props: {
  scenario: ScenarioDto;
  arg: ScenarioArgumentDto;
  autoFocus?: boolean;
}) {
  const setArgumentValue = useBearStore(
    (s) => s.room.scenario.runScenarioModal.setArgumentValue,
  );
  const argumentValue = useBearStore(
    (s) =>
      s.room.scenario.runScenarioModal.arguments.find(
        (a) => a.identifier === props.arg.identifier,
      )?.value ?? "",
  );
  const [clipboardEnabled, , readClipboard] = useClipboard();

  const parameter = props.scenario.parameters.find(
    (p) => p.identifier === props.arg.identifier,
  );

  if (parameter == null) {
    return null;
  }

  const argumentValueIsValid: boolean = (() => {
    return match(parameter.dataType)
      .with("string", () => {
        return true;
      })
      .with("number", () => {
        return !isNaN(Number(argumentValue));
      })
      .with("json", () => {
        try {
          JSON.parse(argumentValue);
          return true;
        } catch {
          return false;
        }
      })
      .with("startDateTime", () => {
        return DateTool.parseExactLocalDate(argumentValue) != null;
      })
      .with("endDateTime", () => {
        return DateTool.parseExactLocalDate(argumentValue) != null;
      })
      .exhaustive();
  })();

  return (
    <Form.Group key={parameter.identifier}>
      <Stack
        direction={"horizontal"}
        className={clsx(
          "bg-body border-top border-bottom align-items-stretch ps-2",
          argumentValueIsValid ? "" : "bg-danger-subtle",
        )}
      >
        <OverlayTrigger overlay={<Tooltip>${parameter.identifier}</Tooltip>}>
          <Form.Label
            style={{ width: "150px" }}
            className={clsx("mb-0 d-flex align-items-center pt-1 pb-1")}
          >
            <span className={"small"}>{parameter.title}</span>
          </Form.Label>
        </OverlayTrigger>
        <Form.Control
          type="text"
          placeholder={"Enter a value…"}
          size={"sm"}
          value={argumentValue}
          onChange={(event) => {
            setArgumentValue(parameter.identifier, event.target.value);
          }}
          className={"rounded-0 border-0 border-start border-end ms-2"}
          autoFocus={props.autoFocus}
        />
        <NavbarButton
          icon={"x-lg"}
          onClick={() => {
            setArgumentValue(parameter.identifier, "");
          }}
        ></NavbarButton>

        <OverlayTrigger overlay={<Tooltip>Paste</Tooltip>}>
          <Stack className={"align-self-stretch"} direction={"horizontal"}>
            <NavbarButton
              disabled={!clipboardEnabled}
              icon={"clipboard-check"}
              onClick={async () => {
                setArgumentValue(parameter.identifier, await readClipboard());
              }}
            ></NavbarButton>
          </Stack>
        </OverlayTrigger>
      </Stack>
    </Form.Group>
  );
}
