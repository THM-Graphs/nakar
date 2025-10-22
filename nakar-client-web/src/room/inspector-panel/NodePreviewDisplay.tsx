import { useBearStore } from "../../state/useBearStore.ts";
import { getBackgroundColorOfNode } from "../../color/getBackgroundColor.ts";
import { getTextColor } from "../../color/getTextColor.ts";
import clsx from "clsx";
import { useColorSchema } from "../../color/useColorSchema.ts";
import { NodePreview } from "../../../src-gen";
import { isMultiSelectKey } from "../../dom/isMultiSelectKey.ts";
import { MouseEvent } from "react";

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
  const bgColor = getBackgroundColorOfNode(
    props.node,
    colorSchema,
    graphLabels,
  );
  const fgColor = getTextColor(
    props.node.customColor?.color ?? graphLabel?.color ?? null,
    colorSchema,
  );
  const setDetailElement = useBearStore(
    (s) => s.room.panels.inspector.setElement,
  );
  const appendElement = useBearStore(
    (s) => s.room.panels.inspector.appendElement,
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
      onClick={(event: MouseEvent<HTMLSpanElement>) => {
        if (props.disableClick === true) {
          return;
        }
        if (isMultiSelectKey(event)) {
          appendElement(props.node.id);
        } else {
          setDetailElement(props.node.id);
        }
      }}
    >
      {trimmedTitle}
    </span>
  );
}
