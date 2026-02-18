import { Form, Stack } from "react-bootstrap";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";
import { LabelViewSettingsColorEditor } from "./LabelViewSettingsColorEditor.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCallback, useMemo } from "react";
import {
  actionControllerSetViewSettings,
  LiveCanvasLabelViewSettingsDto,
} from "../../../src-gen";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";

export function LabelViewSettingsEditor(props: {
  label: string;
  className?: string;
}) {
  const roomContext = useCanvasContext();
  const visualization = useBearStore((s) => s.room.scenario.graph.viewSettings);
  const setData = useBearStore((s) => s.room.panels.visualization.setData);
  const labelVisualization = useMemo(() => {
    return visualization.labelSettings.find((ls) => ls.label === props.label);
  }, [props.label, visualization]);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const onChange = useCallback(
    (newValue: LiveCanvasLabelViewSettingsDto) => {
      const newViewSettings = {
        ...visualization,
        labelSettings: visualization.labelSettings.map((ls) =>
          ls.label === newValue.label ? newValue : ls,
        ),
      };
      setData(newViewSettings);
      actionControllerSetViewSettings({
        path: {
          roomId: roomContext.initialRoomData.id,
          canvasId: roomContext.initialCanvasData.id,
        },
        body: newViewSettings,
      })
        .then((res) => {
          return resultOrThrow(res);
        })
        .catch(pushErrorNotification);
    },
    [setData, visualization],
  );

  if (labelVisualization == null) {
    return null;
  }
  return (
    <Stack className={props.className}>
      <LabelViewSettingsColorEditor
        label={labelVisualization.label}
        colorIndex={labelVisualization.colorIndex}
        setColorIndex={(newValue) => {
          onChange({
            ...labelVisualization,
            colorIndex: newValue,
          });
        }}
      ></LabelViewSettingsColorEditor>
      <Form.Check
        id={`customRadius${labelVisualization.label}`}
        label={<span className={"small"}>Size</span>}
        checked={labelVisualization.customRadius}
        onChange={(e) => {
          onChange({
            ...labelVisualization,
            customRadius: e.target.checked,
          });
        }}
      ></Form.Check>
      {labelVisualization.customRadius && (
        <NumberInput
          min={5}
          value={labelVisualization.radius}
          onChange={(newValue: number) => {
            onChange({
              ...labelVisualization,
              radius: newValue,
            });
          }}
          className={"mb-1"}
        ></NumberInput>
      )}
    </Stack>
  );
}
