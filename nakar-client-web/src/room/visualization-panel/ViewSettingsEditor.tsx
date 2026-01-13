import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { Form, Stack } from "react-bootstrap";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";
import { LiveCanvasViewSettingsDto } from "../../../src-gen";

export function ViewSettingsEditor(props: {
  viewSettings: LiveCanvasViewSettingsDto;
  onChange: (newSettings: LiveCanvasViewSettingsDto) => void;
}) {
  const visualizationData = props.viewSettings;
  return (
    <Stack className={"mb-5 flex-grow-0 flex-shrink-1 mb-auto pb-5"} gap={5}>
      <Collapsable
        title={<span className={"small"}>General</span>}
        initialState={false}
        className={"border-bottom"}
      >
        <Stack className={"pt-2 pb-2 border-top"} gap={2}>
          <Stack className={"ps-2 pe-2 pb-2 border-bottom"}>
            <Form.Check
              id={"growNodesBasedOnDegree"}
              label={
                <span className={"small"}>Grow Nodes Based On Degree</span>
              }
              checked={visualizationData.growNodesBasedOnDegree}
              onChange={(e) => {
                props.onChange({
                  ...props.viewSettings,
                  growNodesBasedOnDegree: e.target.checked,
                });
              }}
            ></Form.Check>
            {visualizationData.growNodesBasedOnDegree && (
              <NumberInput
                value={visualizationData.growNodesBasedOnDegreeFactor}
                onChange={(newValue: number) => {
                  props.onChange({
                    ...props.viewSettings,
                    growNodesBasedOnDegreeFactor: newValue,
                  });
                }}
              ></NumberInput>
            )}
            <Form.Text className={"small text-muted"}>
              The higher the degree of a node, the larger it is displayed.
            </Form.Text>
          </Stack>
          <Stack className={"ps-2 pe-2"}>
            <Form.Label className={"small"}>
              Relationship Cluster Size
            </Form.Label>
            <NumberInput
              value={visualizationData.compressRelationshipsWidthFactor}
              onChange={(newValue: number) => {
                props.onChange({
                  ...props.viewSettings,
                  compressRelationshipsWidthFactor: newValue,
                });
              }}
            ></NumberInput>
            <Form.Text className={"small text-muted"}>
              The lines of a relationship that is a cluster become thicker.
            </Form.Text>
          </Stack>
        </Stack>
      </Collapsable>
    </Stack>
  );
}
