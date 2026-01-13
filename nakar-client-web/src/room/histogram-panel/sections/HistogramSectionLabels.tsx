import { ValueDisplay } from "../ValueDisplay.tsx";
import { CanvasContext } from "../../../pages/CanvasPage.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { labelActions } from "../../actions/groups/labelActions.ts";
import { getBackgroundColorOfLabel } from "../../color/getBackgroundColor.ts";
import { useColorSchema } from "../../color/useColorSchema.ts";
import { SelectAllNodesOfLabel } from "../../actions/SelectAllNodesOfLabel.ts";

export function HistogramSectionLabels(props: { roomContext: CanvasContext }) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
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
                roomContext={props.roomContext}
                label={entry.value}
                subLabel={
                  label && label.sources.length > 0
                    ? label.sources.join(", ")
                    : undefined
                }
                onSelect={() => {
                  SelectAllNodesOfLabel.shared.runAsync({
                    labels: [entry.value],
                    roomContext: props.roomContext,
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
                    roomContext: props.roomContext,
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
