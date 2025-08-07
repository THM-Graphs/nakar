import { ValueDisplay } from "../ValueDisplay.tsx";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import { postRoomActionDeleteElements } from "../../../../../../src-gen";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { DynamicList } from "../../../../shared/DynamicList.tsx";

export function HistogramSectionNodes(props: { roomContext: RoomContext }) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
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
            return (
              <ValueDisplay
                key={nodeEntry.id}
                roomContext={props.roomContext}
                value={nodeEntry.degree}
                percentage={nodeEntry.percentage}
                label={nodeEntry.title}
                subLabel={nodeEntry.id}
                nodeLabels={nodeEntry.labels}
                onSelect={() => {
                  setElement(nodeEntry.id);
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
