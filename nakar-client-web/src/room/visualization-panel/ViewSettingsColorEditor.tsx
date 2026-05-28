import { Stack } from "react-bootstrap";
import { LiveCanvasLabelViewSettingsDto } from "api-client";
import { useColorSchema } from "../color/useColorSchema.ts";
import clsx from "clsx";
import { useTheme } from "../../shared/theme/useTheme.ts";

export function ViewSettingsColorEditor(props: {
  colorIndex: LiveCanvasLabelViewSettingsDto["colorIndex"];
  setColorIndex: (
    newValue: LiveCanvasLabelViewSettingsDto["colorIndex"],
  ) => void;
}) {
  const colorSchema = useColorSchema();
  const theme = useTheme();

  return (
    <Stack direction={"horizontal"} gap={1} className={"align-items-center"}>
      {(
        [0, 1, 2, 3, 4, 5] as LiveCanvasLabelViewSettingsDto["colorIndex"][]
      ).map((index: LiveCanvasLabelViewSettingsDto["colorIndex"]) => (
        <Stack
          direction={"horizontal"}
          key={index}
          style={{
            width: "20px",
            height: "20px",
            backgroundColor: colorSchema.getBackgroundColor(index),
            borderStyle: "solid",
            borderColor: theme === "light" ? "#000" : "#fff",
          }}
          className={clsx(
            "rounded flex-shrink-0 flex-grow-0 pointer align-self-center",
            props.colorIndex == index ? "border-2" : "border-0",
          )}
          onClick={() => {
            props.setColorIndex(index);
          }}
        ></Stack>
      ))}
    </Stack>
  );
}
