import { ColorSchema } from "../../color/ColorSchema.ts";
import { Stack } from "react-bootstrap";

export function ColorSchemaPreview(props: { colorSchema: ColorSchema }) {
  return (
    <Stack
      direction={"horizontal"}
      style={{
        paddingRight: "10px",
      }}
      gap={1}
      className={"p-1 rounded-pill"}
    >
      {([0, 1, 2, 3, 4, 5] as (0 | 1 | 2 | 3 | 4 | 5)[]).map((index) => (
        <div
          style={{
            width: "20px",
            height: "20px",
            backgroundColor: props.colorSchema.getBackgroundColor(index),
            marginRight: "-10px",
          }}
          key={index}
          className={"rounded-circle"}
        ></div>
      ))}
    </Stack>
  );
}
