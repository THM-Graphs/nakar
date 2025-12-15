import { useEffect, useState } from "react";
import { ColorSchema } from "./ColorSchema.ts";
import { useBearStore } from "../../state/useBearStore.ts";

export function useColorSchema() {
  const colorSchemaSlug = useBearStore((s) => s.room.canvas.colorSchemaSlug);
  const [colorSchema, setColorSchema] = useState<ColorSchema>(
    ColorSchema.default(),
  );
  useEffect(() => {
    setColorSchema(ColorSchema.find(colorSchemaSlug));
  }, [colorSchemaSlug]);
  return colorSchema;
}
