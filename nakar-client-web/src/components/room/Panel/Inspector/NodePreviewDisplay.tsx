import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { getBackgroundColor } from "../../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../../lib/color/getTextColor.ts";
import clsx from "clsx";
import { useColorSchema } from "../../../../lib/color/useColorSchema.ts";

const maxTitleLength: number = 50;
export function NodePreviewDisplay(props: {
  nodeId: string;
  nodeTitle: string;
  labels: string[];
  className?: string;
}) {
  const graphLabels = useBearStore(
    (s) => s.room.scenario.graph.elements.labels,
  );
  const colorSchema = useColorSchema();

  const firstLabel = props.labels[0];
  const graphLabel = graphLabels.find((l) => l.label === firstLabel);
  const bgColor = graphLabel
    ? getBackgroundColor(graphLabel.color, colorSchema)
    : null;
  const fgColor = graphLabel
    ? getTextColor(graphLabel.color, colorSchema)
    : null;
  const setDetailElement = useBearStore(
    (s) => s.room.panels.inspector.setElement,
  );
  const trimmedTitle =
    props.nodeTitle.length > maxTitleLength
      ? props.nodeTitle.slice(0, maxTitleLength).trim() + "…"
      : props.nodeTitle;

  return (
    <span
      className={clsx(
        "badge pointer text-center text-wrap text-break",
        props.className,
      )}
      style={{
        backgroundColor: bgColor ?? undefined,
        color: fgColor ?? undefined,
      }}
      onClick={() => {
        setDetailElement({ type: "node", nodeId: props.nodeId });
      }}
    >
      {trimmedTitle}
    </span>
  );
}
