import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { getBackgroundColor } from "../../../../lib/color/getBackgroundColor.ts";
import { getTextColor } from "../../../../lib/color/getTextColor.ts";
import clsx from "clsx";
import { useColorSchema } from "../../../../lib/color/useColorSchema.ts";
import { NodePreview } from "../../../../../src-gen";

const maxTitleLength: number = 20;
export function NodePreviewDisplay(props: {
  node: NodePreview;
  className?: string;
  disableClick?: boolean;
}) {
  const graphLabels = useBearStore(
    (s) => s.room.scenario.graph.elements.labels,
  );
  const colorSchema = useColorSchema();

  const firstLabel = props.node.labels[0];
  const graphLabel = graphLabels.find((l) => l.label === firstLabel);
  const bgColor = getBackgroundColor(
    props.node.customColor?.color ?? graphLabel?.color ?? null,
    colorSchema,
  );
  const fgColor = getTextColor(
    props.node.customColor?.color ?? graphLabel?.color ?? null,
    colorSchema,
  );
  const setDetailElement = useBearStore(
    (s) => s.room.panels.inspector.setElement,
  );
  const trimmedTitle =
    props.node.title.length > maxTitleLength
      ? props.node.title.slice(0, maxTitleLength).trim() + "…"
      : props.node.title;

  return (
    <span
      className={clsx(
        "badge text-center text-wrap text-break",
        props.className,
        props.disableClick ? "" : "pointer",
      )}
      style={{
        backgroundColor: bgColor,
        color: fgColor,
      }}
      onClick={() => {
        if (props.disableClick === true) {
          return;
        }
        setDetailElement(props.node.id);
      }}
    >
      {trimmedTitle}
    </span>
  );
}
