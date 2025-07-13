import { Collapsable } from "../../../Collapsable.tsx";
import { EmptyHint } from "../EmptyHint.tsx";
import { ValueDisplay } from "../ValueDisplay.tsx";
import { getBackgroundColor } from "../../../../../lib/color/getBackgroundColor.ts";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import { postRoomActionDeleteElements } from "../../../../../../src-gen";
import { Button, Stack } from "react-bootstrap";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { useState } from "react";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";

export function HistogramSectionNodes(props: { roomContext: RoomContext }) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const [showAllNodes, setShowAllNodes] = useState<boolean>(false);

  return (
    <Stack className={"border-bottom"}>
      <Collapsable
        title={<span className={"fw-bold small"}>Nodes</span>}
        initialState={false}
      >
        <EmptyHint list={histogram.nodes}></EmptyHint>
        {histogram.nodes
          .slice(0, showAllNodes ? histogram.nodes.length : 10)
          .map((nodeEntry) => {
            const nodeLabels = labels.filter((graphLabel) =>
              nodeEntry.labels.includes(graphLabel.label),
            );
            return (
              <ValueDisplay
                value={nodeEntry.degree}
                percentage={nodeEntry.percentage}
                label={nodeEntry.title}
                subLabel={nodeEntry.id}
                bgColors={nodeLabels.map((l) => getBackgroundColor(l.color))}
                onRemove={async () => {
                  resultOrThrow(
                    await postRoomActionDeleteElements({
                      path: {
                        id: props.roomContext.initialRoomData.id,
                      },
                      body: {
                        nodes: [nodeEntry.id],
                        labels: [],
                        edges: [],
                        edgeTypes: [],
                      },
                    }),
                  );
                }}
              ></ValueDisplay>
            );
          })}
        {!showAllNodes && histogram.nodes.length > 10 && (
          <Button
            variant={""}
            size={"sm"}
            className={"text-muted fst-italic small rounded-0"}
            onClick={() => {
              setShowAllNodes(true);
            }}
          >
            …show all {histogram.nodes.length} elements
          </Button>
        )}
      </Collapsable>
    </Stack>
  );
}
