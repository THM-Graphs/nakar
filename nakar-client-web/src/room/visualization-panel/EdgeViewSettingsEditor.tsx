import { Form, Stack } from "react-bootstrap";
import { ViewSettingsColorEditor } from "./ViewSettingsColorEditor.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCallback, useMemo } from "react";
import {
  actionControllerSetViewSettings,
  LiveCanvasEdgeViewSettingsDto,
  LiveCanvasViewSettingsDto,
} from "../../../src-gen";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { NumberInput } from "../../shared/elements/NumberInput.tsx";
import clsx from "clsx";

export function EdgeViewSettingsEditor(props: {
  edgeType: string;
  className?: string;
}) {
  const roomContext = useCanvasContext();
  const visualization = useBearStore((s) => s.room.scenario.graph.viewSettings);
  const setData = useBearStore((s) => s.room.panels.visualization.setData);
  const edgeVisualization = useMemo(() => {
    return visualization.edgeSettings.find(
      (ls) => ls.edgeType === props.edgeType,
    );
  }, [props.edgeType, visualization]);
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );

  const onChange = useCallback(
    (newValue: LiveCanvasEdgeViewSettingsDto) => {
      const newViewSettings = {
        ...visualization,
        edgeSettings: visualization.edgeSettings.map((ls) =>
          ls.edgeType === newValue.edgeType ? newValue : ls,
        ),
      } satisfies LiveCanvasViewSettingsDto;
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

  if (edgeVisualization == null) {
    return null;
  }
  return (
    <Stack className={clsx("flex-grow-0", props.className)}>
      <Form.Check
        id={`customColor${edgeVisualization.edgeType}`}
        label={<span className={"small"}>Color</span>}
        checked={edgeVisualization.customColor}
        onChange={(e) => {
          onChange({
            ...edgeVisualization,
            customColor: e.target.checked,
          });
        }}
      ></Form.Check>
      {edgeVisualization.customColor && (
        <ViewSettingsColorEditor
          colorIndex={edgeVisualization.colorIndex}
          setColorIndex={(newValue) => {
            onChange({
              ...edgeVisualization,
              colorIndex: newValue,
            });
          }}
        ></ViewSettingsColorEditor>
      )}
      <Form.Check
        id={`customWidth${edgeVisualization.edgeType}`}
        label={<span className={"small"}>Width</span>}
        checked={edgeVisualization.customWidth}
        onChange={(e) => {
          onChange({
            ...edgeVisualization,
            customWidth: e.target.checked,
          });
        }}
      ></Form.Check>
      {edgeVisualization.customWidth && (
        <NumberInput
          min={0}
          value={edgeVisualization.width}
          onChange={(newValue: number) => {
            onChange({
              ...edgeVisualization,
              width: newValue,
            });
          }}
          className={"mb-1"}
        ></NumberInput>
      )}
    </Stack>
  );
}
