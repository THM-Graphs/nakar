import { Stack } from "react-bootstrap";
import { postRoomActionDeleteElements } from "../../../../../../src-gen";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { ValueDisplay } from "../ValueDisplay.tsx";
import { resultOrThrow } from "../../../../../lib/data/resultOrThrow.ts";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { DynamicList } from "../../../../shared/DynamicList.tsx";

export function HistogramSectionRelationships(props: {
  roomContext: RoomContext;
}) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  return (
    <Stack className={"border-bottom"}>
      <DynamicList
        data={histogram.edgeTypes}
        entityNamePlural={"Relationship Types"}
        filter={(exp, rt) => rt.type.toLowerCase().includes(exp.toLowerCase())}
        render={(list) => (
          <>
            {list.map((entry) => (
              <ValueDisplay
                label={entry.type}
                value={entry.count}
                roomContext={props.roomContext}
                percentage={entry.percentage}
                key={entry.type}
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
                            labels: [],
                            edges: [],
                            edgeTypes: [entry.type],
                          },
                        }),
                      );
                    },
                  },
                ]}
              ></ValueDisplay>
            ))}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
