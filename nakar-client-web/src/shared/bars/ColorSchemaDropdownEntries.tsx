import { ColorSchema } from "../../color/ColorSchema.ts";
import { Dropdown, Stack } from "react-bootstrap";
import { ColorSchemaPreview } from "./ColorSchemaPreview.tsx";
import { useColorSchema } from "../../color/useColorSchema.ts";
import { useBearStore } from "../../state/useBearStore.ts";

export function ColorSchemaDropdownEntries() {
  const currentColorSchema = useColorSchema();
  const setColorSchema = useBearStore((s) => s.room.canvas.setColorSchema);

  return (
    <>
      {ColorSchema.allColorSchema().map((colorSchema) => (
        <Dropdown.Item
          key={colorSchema.slug}
          active={colorSchema.slug === currentColorSchema.slug}
          onClick={() => {
            setColorSchema(colorSchema.slug);
          }}
        >
          <Stack
            direction={"horizontal"}
            gap={2}
            className={"justify-content-between"}
          >
            <span className={"small"}>{colorSchema.title}</span>
            <ColorSchemaPreview colorSchema={colorSchema}></ColorSchemaPreview>
          </Stack>
        </Dropdown.Item>
      ))}
    </>
  );
}
