import { Collapsable } from "../../../Collapsable.tsx";
import { EmptyHint } from "../EmptyHint.tsx";
import { Stack } from "react-bootstrap";
import { postRoomActionDeleteElements } from "../../../../../../src-gen";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { ValueDisplay } from "../ValueDisplay.tsx";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";

export function HistogramSectionRelationships(props: {
  roomContext: RoomContext;
}) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  return (
    <Stack className={"border-bottom"}>
      <Collapsable
        title={<span className={"fw-bold small"}>Relationships</span>}
        initialState={false}
      >
        <EmptyHint list={histogram.edgeTypes}></EmptyHint>
        {histogram.edgeTypes.map((entry) => (
          <ValueDisplay
            label={entry.type}
            value={entry.count}
            percentage={entry.percentage}
            key={entry.type}
            onRemove={async (): Promise<void> => {
              resultOrThrow(
                await postRoomActionDeleteElements({
                  path: {
                    id: props.roomContext.initialRoomData.id,
                  },
                  body: {
                    nodes: [],
                    labels: [],
                    edges: [],
                    edgeTypes: [entry.type],
                  },
                }),
              );
            }}
          ></ValueDisplay>
        ))}
      </Collapsable>
    </Stack>
  );
}
