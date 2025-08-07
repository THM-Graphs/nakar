import { ValueDisplay } from "../ValueDisplay.tsx";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import {
  postRoomActionCompressNodes,
  postRoomActionDeleteElements,
  postRoomActionLayoutLabel,
} from "../../../../../../src-gen";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { DynamicList } from "../../../../shared/DynamicList.tsx";

export function HistogramSectionLabels(props: { roomContext: RoomContext }) {
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );

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
                value={entry.count}
                percentage={entry.percentage}
                key={entry.label}
                nodeLabels={[entry.label]}
                customActions={[
                  {
                    title: "Remove",
                    icon: "eye-slash",
                    action: async () => {
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
                    },
                  },
                  {
                    title: "Compress",
                    icon: "arrows-collapse",
                    action: async () => {
                      resultOrThrow(
                        await postRoomActionCompressNodes({
                          path: {
                            id: props.roomContext.initialRoomData.id,
                          },
                          body: {
                            label: entry.label,
                          },
                        }),
                      );
                    },
                  },
                  {
                    title: "Layout Small Circle",
                    icon: "1-circle",
                    action: async () => {
                      resultOrThrow(
                        await postRoomActionLayoutLabel({
                          path: {
                            id: props.roomContext.initialRoomData.id,
                          },
                          body: {
                            label: entry.label,
                            layoutAlgorithm: "circle",
                            circleLayoutDistance: 100,
                          },
                        }),
                      );
                    },
                  },
                  {
                    title: "Layout Medium Circle",
                    icon: "2-circle",
                    action: async () => {
                      resultOrThrow(
                        await postRoomActionLayoutLabel({
                          path: {
                            id: props.roomContext.initialRoomData.id,
                          },
                          body: {
                            label: entry.label,
                            layoutAlgorithm: "circle",
                            circleLayoutDistance: 1000,
                          },
                        }),
                      );
                    },
                  },
                  {
                    title: "Layout Large Circle",
                    icon: "3-circle",
                    action: async () => {
                      resultOrThrow(
                        await postRoomActionLayoutLabel({
                          path: {
                            id: props.roomContext.initialRoomData.id,
                          },
                          body: {
                            label: entry.label,
                            layoutAlgorithm: "circle",
                            circleLayoutDistance: 10000,
                          },
                        }),
                      );
                    },
                  },
                  {
                    title: "Layout Force Directed",
                    icon: "tropical-storm",
                    action: async () => {
                      resultOrThrow(
                        await postRoomActionLayoutLabel({
                          path: {
                            id: props.roomContext.initialRoomData.id,
                          },
                          body: {
                            label: entry.label,
                            layoutAlgorithm: "forceDirected",
                            circleLayoutDistance: null,
                          },
                        }),
                      );
                    },
                  },
                ]}
              ></ValueDisplay>
            );
          })}
        </>
      )}
    ></DynamicList>
  );
}
