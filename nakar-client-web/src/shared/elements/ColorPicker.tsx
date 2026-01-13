import { Form, Stack } from "react-bootstrap";
import { useColorSchema } from "../../room/color/useColorSchema.ts";
import { useBearStore } from "../../state/useBearStore.ts";
import { ColorDto, ColorPresetDto } from "../../../src-gen";
import { match } from "ts-pattern";
import { ReactNode } from "react";

export function ColorPicker(props: {
  color: ColorDto | null;
  onColorChange: (newColor: ColorDto | null) => void;
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
                      index as ColorPresetDto["index"],
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
                    color: {
                      type: "ColorPresetDto",
                      index: index as ColorPresetDto["index"],
                    },
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
                color: {
                  type: "ColorCustomDto",
                  backgroundColor: "#ffffff",
                  textColor: "#000000",
                },
              });
            }
          }}
        />

        {match(color?.color)
          .returnType<ReactNode>()
          .with(
            {
              type: "ColorCustomDto",
            },
            (customColor): ReactNode => (
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
                        color: {
                          type: "ColorCustomDto",
                          backgroundColor: e.target.value,
                          textColor: customColor.textColor,
                        },
                      });
                    }}
                    value={customColor.backgroundColor}
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
                        color: {
                          type: "ColorCustomDto",
                          backgroundColor: customColor.backgroundColor,
                          textColor: e.target.value,
                        },
                      });
                    }}
                    value={customColor.textColor}
                  />
                  <span className={"text-muted"}>Text Color</span>
                </Stack>
              </Stack>
            ),
          )
          .otherwise(() => null)}
      </Form>
    </Stack>
  );
}
