import { Form, Stack } from "react-bootstrap";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";
import {
  LiveCanvasLabelViewSettingsDto,
  LiveCanvasViewSettingsDto,
} from "../../../src-gen";
import { LabelViewSettingsEditor } from "./LabelViewSettingsEditor.tsx";

export function ViewSettingsEditor(props: {
  viewSettings: LiveCanvasViewSettingsDto;
  onChange: (newSettings: LiveCanvasViewSettingsDto) => void;
}) {
  const visualizationData = props.viewSettings;
  return (
    <Stack>
      <Stack className={"p-2 border-bottom"} gap={0}>
        <Form.Check
          className={"flex-grow-0"}
          label={<span className={"small"}>Grow Nodes Based On Degree</span>}
          id={"growNodesBasedOnDegree"}
          checked={visualizationData.growNodesBasedOnDegree}
          onChange={(e) => {
            props.onChange({
              ...props.viewSettings,
              growNodesBasedOnDegree: e.target.checked,
            });
          }}
        ></Form.Check>
        <NumberInput
          className={"flex-grow-1"}
          disabled={!visualizationData.growNodesBasedOnDegree}
          value={visualizationData.growNodesBasedOnDegreeFactor}
          onChange={(newValue: number) => {
            props.onChange({
              ...props.viewSettings,
              growNodesBasedOnDegreeFactor: newValue,
            });
          }}
        ></NumberInput>
        <span className={"small text-muted"}>
          The higher the degree of a node, the larger it is displayed.
        </span>
      </Stack>
      <Stack className={"p-2"}>
        <span className={"small"}>Relationship Cluster Size</span>
        <NumberInput
          value={visualizationData.compressRelationshipsWidthFactor}
          onChange={(newValue: number) => {
            props.onChange({
              ...props.viewSettings,
              compressRelationshipsWidthFactor: newValue,
            });
          }}
        ></NumberInput>
        <span className={"small text-muted"}>
          The lines of a relationship that is a cluster become thicker.
        </span>
      </Stack>
      {props.viewSettings.labelSettings.map(
        (labelViewSettings: LiveCanvasLabelViewSettingsDto) => (
          <LabelViewSettingsEditor
            key={labelViewSettings.label}
            value={labelViewSettings}
            onChange={(newValue: LiveCanvasLabelViewSettingsDto) => {
              const newViewSettings = {
                ...props.viewSettings,
                labelSettings: props.viewSettings.labelSettings.map((ls) =>
                  ls.label === newValue.label ? newValue : ls,
                ),
              };
              props.onChange(newViewSettings);
            }}
          ></LabelViewSettingsEditor>
        ),
      )}
    </Stack>
  );
}
