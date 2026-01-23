import { Form, Stack } from "react-bootstrap";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";
import {
  LiveCanvasLabelViewSettingsDto,
  LiveCanvasViewSettingsDto,
} from "../../../src-gen";
import { LabelViewSettingsEditor } from "./LabelViewSettingsEditor.tsx";
import { Label } from "../labels/Label.tsx";

export function ViewSettingsEditor(props: {
  viewSettings: LiveCanvasViewSettingsDto;
  onChange: (newSettings: LiveCanvasViewSettingsDto) => void;
  className?: string;
}) {
  const visualizationData = props.viewSettings;
  return (
    <Stack className={props.className}>
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
        {visualizationData.growNodesBasedOnDegree && (
          <>
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
          </>
        )}
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
          <Stack className={"border-top p-2"}>
            <Stack className={"pb-2"}>
              <Label
                label={labelViewSettings.label}
                showAmount={true}
                showSources={true}
                hideLabelMenu={true}
              ></Label>
            </Stack>
            <LabelViewSettingsEditor
              key={labelViewSettings.label}
              label={labelViewSettings.label}
            ></LabelViewSettingsEditor>
          </Stack>
        ),
      )}
    </Stack>
  );
}
