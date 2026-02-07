import { ValueDisplay } from "../ValueDisplay.tsx";
import { useCanvasContext } from "../../../pages/Canvas.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { labelActions } from "../../actions/groups/labelActions.ts";
import { getBackgroundColorOfLabel } from "../../color/getBackgroundColor.ts";
import { useColorSchema } from "../../color/useColorSchema.ts";
import { SelectAllNodesOfLabel } from "../../actions/SelectAllNodesOfLabel.ts";

export function HistogramSectionLabels() {
  const roomContext = useCanvasContext();
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const histogram = useBearStore((s) => s.room.scenario.graph.histogram);
  const colorSchema = useColorSchema();

  return (
    <DynamicList
      data={histogram.nodeLabels}
      entityNamePlural={"Labels"}
      filter={(exp, l) => l.value.toLowerCase().includes(exp.toLowerCase())}
      render={(list) => (
        <>
          {list.map((entry) => {
            const label = labels.find(
              (graphLabel) => graphLabel.label === entry.value,
            );

            return (
              <ValueDisplay
                label={entry.value}
                subLabel={
                  label && label.sources.length > 0
                    ? label.sources.join(", ")
                    : undefined
                }
                onSelect={() => {
                  SelectAllNodesOfLabel.shared.runAsync({
                    labels: [entry.value],
                    roomContext: roomContext,
                  });
                }}
                value={entry.count}
                percentage={entry.percentage}
                key={entry.value}
                nodeColors={
                  label ? [getBackgroundColorOfLabel(label, colorSchema)] : []
                }
                customActions={labelActions.map((action) =>
                  action.detailPaneAction(() => ({
                    labels: [entry.value],
                    roomContext: roomContext,
                  })),
                )}
              ></ValueDisplay>
            );
          })}
        </>
      )}
    ></DynamicList>
  );
}
