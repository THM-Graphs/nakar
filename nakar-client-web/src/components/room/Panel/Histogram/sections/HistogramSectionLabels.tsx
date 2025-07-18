import { ValueDisplay } from "../ValueDisplay.tsx";
import { getBackgroundColor } from "../../../../../lib/color/getBackgroundColor.ts";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import { postRoomActionDeleteElements } from "../../../../../../src-gen";
import { Stack } from "react-bootstrap";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { DynamicList } from "../../../../shared/DynamicList.tsx";

export function HistogramSectionLabels(props: { roomContext: RoomContext }) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );

  return (
    <Stack className={"border-bottom"}>
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
                  value={entry.count}
                  percentage={entry.percentage}
                  key={entry.label}
                  bgColors={
                    label ? [getBackgroundColor(label.color)] : undefined
                  }
                  onRemove={async (): Promise<void> => {
                    resultOrThrow(
                      await postRoomActionDeleteElements({
                        path: {
                          id: props.roomContext.initialRoomData.id,
                        },
                        body: {
                          nodes: [],
                          labels: [entry.label],
                          edges: [],
                          edgeTypes: [],
                        },
                      }),
                    );
                  }}
                ></ValueDisplay>
              );
            })}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
