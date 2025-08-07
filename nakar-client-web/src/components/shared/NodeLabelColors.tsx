import { useBearStore } from "../../lib/state/useBearStore.ts";
import { getBackgroundColor } from "../../lib/color/getBackgroundColor.ts";
import { useColorSchema } from "../../lib/color/useColorSchema.ts";
import { Stack } from "react-bootstrap";

export function NodeLabelColors(props: { labels: string[] }) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const colorSchema = useColorSchema();
  const nodeLabels = labels.filter((graphLabel) =>
    props.labels.includes(graphLabel.label),
  );
  const bgColors = nodeLabels.map((l) =>
    getBackgroundColor(l.color, colorSchema),
  );

  return (
    <Stack
      direction={"horizontal"}
      style={{
        marginRight: bgColors.length === 0 ? "0px" : "12px",
      }}
    >
      {bgColors.map((color, index) => (
        <div
          key={color + index.toString()}
          style={{
            zIndex: 1 + (bgColors.length - index),
            width: "15px",
            height: "15px",
            backgroundColor: color,
            marginRight: "-8px",
          }}
          className={"flex-grow-0 flex-shrink-0 rounded-circle"}
        ></div>
      ))}
    </Stack>
  );
}
