import { LiveCanvasLabelViewSettingsDto } from "../../../src-gen";
import { Form, Stack } from "react-bootstrap";
import { Label } from "../labels/Label.tsx";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";

export function LabelViewSettingsEditor(props: {
  value: LiveCanvasLabelViewSettingsDto;
  onChange: (newValue: LiveCanvasLabelViewSettingsDto) => void;
}) {
  return (
    <Stack className={"border-top p-2"}>
      <Stack className={"pb-2"}>
        <Label
          label={props.value.label}
          showAmount={true}
          showSources={true}
        ></Label>
      </Stack>
      <Form.Check
        id={`customRadius${props.value.label}`}
        label={<span className={"small"}>Custom Radius</span>}
        checked={props.value.customRadius}
        onChange={(e) => {
          props.onChange({
            ...props.value,
            customRadius: e.target.checked,
          });
        }}
      ></Form.Check>
      <NumberInput
        disabled={!props.value.customRadius}
        value={props.value.radius}
        onChange={(newValue: number) => {
          props.onChange({
            ...props.value,
            radius: newValue,
          });
        }}
      ></NumberInput>
    </Stack>
  );
}
