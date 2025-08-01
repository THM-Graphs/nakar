import { ValueDisplay } from "../ValueDisplay.tsx";
import { getBackgroundColor } from "../../../../../lib/color/getBackgroundColor.ts";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import { postRoomActionDeleteElements } from "../../../../../../src-gen";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { DynamicList } from "../../../../shared/DynamicList.tsx";

export function HistogramSectionNodes(props: { roomContext: RoomContext }) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  const labels = useBearStore((s) => s.room.scenario.graph.elements.labels);
  const setElement = useBearStore((s) => s.room.panels.inspector.setElement);
  const onCenter = useBearStore((s) => s.room.ui.rendererEvents.onCenter);

  return (
    <DynamicList
      className={"border-top"}
      data={histogram.nodes}
      entityNamePlural={"Nodes"}
      filter={(exp, n) => n.title.toLowerCase().includes(exp.toLowerCase())}
      render={(list) => (
        <>
          {list.map((nodeEntry) => {
            const nodeLabels = labels.filter((graphLabel) =>
              nodeEntry.labels.includes(graphLabel.label),
            );
            return (
              <ValueDisplay
                key={nodeEntry.id}
                roomContext={props.roomContext}
                value={nodeEntry.degree}
                percentage={nodeEntry.percentage}
                label={nodeEntry.title}
                subLabel={nodeEntry.id}
                bgColors={nodeLabels.map((l) => getBackgroundColor(l.color))}
                onSelect={() => {
                  setElement({ type: "node", nodeId: nodeEntry.id });
                  onCenter.next();
                }}
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
                            nodes: [nodeEntry.id],
                            labels: [],
                            edges: [],
                            edgeTypes: [],
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
