import { Form, Stack } from "react-bootstrap";
import { LiveCanvasLabelViewSettingsDto } from "../../../src-gen";
import { useColorSchema } from "../color/useColorSchema.ts";
import clsx from "clsx";

export function LabelViewSettingsColorEditor(props: {
  customColorIndex: boolean;
  colorIndex: LiveCanvasLabelViewSettingsDto["colorIndex"];
  setColorIndex: (
    newValue: LiveCanvasLabelViewSettingsDto["colorIndex"],
  ) => void;
  setCustomColorIndex: (newValue: boolean) => void;
  label: string;
}) {
  const colorSchema = useColorSchema();
  return (
    <Stack direction={"horizontal"} gap={1} className={"align-items-center"}>
      <Form.Check
        id={`custom_color_${props.label}`}
        label={<span className={"small"}>Color</span>}
        checked={props.customColorIndex}
        onChange={(e) => {
          props.setCustomColorIndex(e.target.checked);
        }}
      ></Form.Check>
      {props.customColorIndex &&
        (
          [0, 1, 2, 3, 4, 5] as LiveCanvasLabelViewSettingsDto["colorIndex"][]
        ).map((index: LiveCanvasLabelViewSettingsDto["colorIndex"]) => (
          <Stack
            direction={"horizontal"}
            key={index}
            style={{
              width: "20px",
              height: "20px",
              backgroundColor: colorSchema.getBackgroundColor(index),
            }}
            className={clsx(
              "rounded flex-shrink-0 flex-grow-0 pointer align-self-center",
              props.colorIndex == index &&
                "border border-2 border-dark shadow-sm",
            )}
            onClick={() => {
              props.setColorIndex(index);
            }}
          ></Stack>
        ))}
    </Stack>
  );
}
