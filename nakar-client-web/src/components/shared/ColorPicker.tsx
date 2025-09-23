import { Color } from "../../../src-gen";
import { Form, Stack } from "react-bootstrap";
import { useColorSchema } from "../../lib/color/useColorSchema.ts";
import { useBearStore } from "../../lib/state/useBearStore.ts";

export type ColorIndex = 0 | 2 | 1 | 3 | 4 | 5;
export function ColorPicker(props: {
  color: Color | null;
  onColorChange: (newColor: Color | null) => void;
}) {
  const colorSchema = useColorSchema();
  const getTheme = useBearStore((s) => s.global.theme.getTheme);
  const color = props.color;

  return (
    <Stack className={"p-2"} gap={1}>
      <Form>
        <Form.Check
          type={"radio"}
          name={"color"}
          id={`color_none`}
          label={<span className={"text-muted"}>None</span>}
          checked={props.color == null}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              props.onColorChange(null);
            }
          }}
        />
        <Stack direction={"horizontal"} gap={3}>
          {[0, 1, 2, 3, 4, 5].map((index: number) => (
            <Form.Check
              type={"radio"}
              name={"color"}
              id={`color_${index.toString()}`}
              label={
                <div
                  style={{
                    backgroundColor: colorSchema.getBackgroundColor(
                      index as ColorIndex,
                    ),
                    width: "20px",
                    height: "20px",
                    marginTop: "1px",
                    border: `1px solid ${getTheme() == "dark" ? "#ffffff" : "#000000"}`,
                  }}
                  className={"rounded-circle"}
                ></div>
              }
              key={index}
              checked={
                props.color != null &&
                "index" in props.color &&
                props.color.index === index
              }
              onChange={(e) => {
                const checked = e.target.checked;
                if (checked) {
                  props.onColorChange({
                    type: "PresetColor",
                    index: index as ColorIndex,
                  });
                }
              }}
            />
          ))}
        </Stack>

        <Form.Check
          type={"radio"}
          name={"color"}
          id={`color_custom`}
          label={<span className={"text-muted"}>Custom</span>}
          checked={props.color != null && "backgroundColor" in props.color}
          onChange={(e) => {
            const checked = e.target.checked;
            if (checked) {
              props.onColorChange({
                type: "CustomColor",
                backgroundColor: "#ffffff",
                textColor: "#000000",
              });
            }
          }}
        />

        {color != null &&
          "backgroundColor" in color &&
          "textColor" in color && (
            <Stack style={{ marginLeft: "20px" }}>
              <Stack direction={"horizontal"} gap={2}>
                <Form.Control
                  type="color"
                  id="bg_color"
                  defaultValue="#000000"
                  title="Background Color"
                  className={"align-self-center"}
                  onChange={(e) => {
                    props.onColorChange({
                      type: "CustomColor",
                      backgroundColor: e.target.value,
                      textColor: color.textColor,
                    });
                  }}
                  value={color.backgroundColor}
                />
                <span className={"text-muted"}>Background Color</span>
              </Stack>
              <Stack direction={"horizontal"} gap={2}>
                <Form.Control
                  type="color"
                  id="text_color"
                  defaultValue="#ffffff"
                  title="Text Color"
                  className={"align-self-center"}
                  onChange={(e) => {
                    props.onColorChange({
                      type: "CustomColor",
                      backgroundColor: color.backgroundColor,
                      textColor: e.target.value,
                    });
                  }}
                  value={color.textColor}
                />
                <span className={"text-muted"}>Text Color</span>
              </Stack>
            </Stack>
          )}
      </Form>
    </Stack>
  );
}
