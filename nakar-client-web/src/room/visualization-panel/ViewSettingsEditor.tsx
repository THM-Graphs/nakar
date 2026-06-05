import { Form, Stack } from "react-bootstrap";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";
import {
  LiveCanvasEdgeViewSettingsDto,
  LiveCanvasLabelViewSettingsDto,
  LiveCanvasViewSettingsDto,
} from "api-client";
import { LabelViewSettingsEditor } from "./LabelViewSettingsEditor.tsx";
import { Label } from "../labels/Label.tsx";
import { Fragment } from "react";
import { EdgeViewSettingsEditor } from "./EdgeViewSettingsEditor.tsx";
import clsx from "clsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";

export function ViewSettingsEditor(props: {
  viewSettings: LiveCanvasViewSettingsDto;
  onChange: (newSettings: LiveCanvasViewSettingsDto) => void;
  className?: string;
}) {
  const visualizationData = props.viewSettings;
  return (
    <Stack className={clsx("flex-grow-0", props.className)}>
      <Stack className={"p-2 border-bottom"} gap={0}>
        <Form.Check
          type="switch"
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
          <Fragment key={labelViewSettings.label}>
            <Collapsable
              collapsed={true}
              title={
                <Stack className={"pt-1 pb-1"}>
                  <Label
                    label={labelViewSettings.label}
                    showAmount={true}
                    showSources={true}
                    hideLabelMenu={true}
                  ></Label>
                </Stack>
              }
              className={"border-bottom"}
            >
              <Stack className={"ps-1 pe-1 pb-1"}>
                <Stack className={"border rounded overflow-hidden p-1 bg-body"}>
                  <LabelViewSettingsEditor
                    label={labelViewSettings.label}
                  ></LabelViewSettingsEditor>
                </Stack>
              </Stack>
            </Collapsable>
          </Fragment>
        ),
      )}
      {props.viewSettings.edgeSettings.map(
        (edgeViewSettings: LiveCanvasEdgeViewSettingsDto) => (
          <Fragment key={edgeViewSettings.edgeType}>
            <Collapsable
              collapsed={true}
              title={
                <Stack className={"pt-1 pb-1"}>
                  <Label
                    label={edgeViewSettings.edgeType}
                    showAmount={true}
                    showSources={true}
                    hideLabelMenu={true}
                  ></Label>
                </Stack>
              }
              className={"border-bottom"}
            >
              <Stack className={"ps-1 pe-1 pb-1"}>
                <Stack className={"border rounded overflow-hidden bg-body p-1"}>
                  <EdgeViewSettingsEditor
                    edgeType={edgeViewSettings.edgeType}
                  ></EdgeViewSettingsEditor>
                </Stack>
              </Stack>
            </Collapsable>
          </Fragment>
        ),
      )}
    </Stack>
  );
}
