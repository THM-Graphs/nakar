import { ValueDisplay } from "../ValueDisplay.tsx";
import { RoomContext } from "../../../pages/Room.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { labelActions } from "../../actions/groups/labelActions.ts";
import { getBackgroundColorOfLabel } from "../../color/getBackgroundColor.ts";
import { useColorSchema } from "../../color/useColorSchema.ts";
import { SelectAllNodesOfLabel } from "../../actions/SelectAllNodesOfLabel.ts";

export function HistogramSectionLabels(props: { roomContext: RoomContext }) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  const colorSchema = useColorSchema();

  return (
    <DynamicList
      data={histogram.nodeLabels}
      entityNamePlural={"Labels"}
      filter={(exp, l) => l.label.toLowerCase().includes(exp.toLowerCase())}
      render={(list) => (
        <>
          {list.map((entry) => {
            const label = labels.find(
              (graphLabel) => graphLabel.label === entry.label,
            );

            return (
              <ValueDisplay
                roomContext={props.roomContext}
                label={entry.label}
                subLabel={
                  label && label.sources.length > 0
                    ? label.sources.join(", ")
                    : undefined
                }
                onSelect={() => {
                  SelectAllNodesOfLabel.shared.runAsync({
                    labels: [entry.label],
                    roomContext: props.roomContext,
                  });
                }}
                value={entry.count}
                percentage={entry.percentage}
                key={entry.label}
                nodeColors={
                  label ? [getBackgroundColorOfLabel(label, colorSchema)] : []
                }
                customActions={labelActions.map((action) =>
                  action.detailPaneAction(() => ({
                    labels: [entry.label],
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
