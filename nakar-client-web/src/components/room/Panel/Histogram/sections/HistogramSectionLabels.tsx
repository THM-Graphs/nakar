import { Collapsable } from "../../../Collapsable.tsx";
import { EmptyHint } from "../EmptyHint.tsx";
import { ValueDisplay } from "../ValueDisplay.tsx";
import { getBackgroundColor } from "../../../../../lib/color/getBackgroundColor.ts";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import { postRoomActionDeleteElements } from "../../../../../../src-gen";
import { Stack } from "react-bootstrap";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";

export function HistogramSectionLabels(props: { roomContext: RoomContext }) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );

  return (
    <Stack className={"border-bottom"}>
      <Collapsable
        key={"labels"}
        title={<span className={"fw-bold small"}>Labels</span>}
        initialState={false}
      >
        <EmptyHint list={histogram.nodeLabels}></EmptyHint>
        {histogram.nodeLabels.map((entry) => {
          const label = labels.find(
            (graphLabel) => graphLabel.label === entry.label,
          );

          return (
            <ValueDisplay
              label={entry.label}
              subLabel={
                label && label.sources.length > 0
                  ? label.sources.join(", ")
                  : undefined
              }
              value={entry.count}
              percentage={entry.percentage}
              key={entry.label}
              bgColors={label ? [getBackgroundColor(label.color)] : undefined}
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
      </Collapsable>
    </Stack>
  );
}
