import { PropertyGroup } from "../PropertyGroup.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { DynamicList } from "../../../DynamicList.tsx";

export function HistogramSectionNodeProperties(props: {
  roomContext: RoomContext;
}) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );

  return (
    <Stack className={"border-bottom"}>
      <DynamicList
        data={histogram.nodeProperties}
        entityNamePlural={"Node Properties"}
        filter={(exp, np) => np.key.toLowerCase().includes(exp.toLowerCase())}
        render={(list) => (
          <>
            {list.map((propertyEntry) => (
              <PropertyGroup
                propertyEntry={propertyEntry}
                key={propertyEntry.key}
                roomContext={props.roomContext}
              ></PropertyGroup>
            ))}
          </>
        )}
      ></DynamicList>
    </Stack>
  );
}
