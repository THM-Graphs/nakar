import { Collapsable } from "../../../Collapsable.tsx";
import { EmptyHint } from "../EmptyHint.tsx";
import { PropertyGroup } from "../PropertyGroup.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../../pages/Room.tsx";

export function HistogramSectionNodeProperties(props: {
  roomContext: RoomContext;
}) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );

  return (
    <Stack className={"border-bottom"}>
      <Collapsable
        title={<span className={"fw-bold small"}>Node Properties</span>}
        initialState={false}
      >
        <EmptyHint list={histogram.nodeProperties}></EmptyHint>
        {histogram.nodeProperties.map((propertyEntry) => (
          <PropertyGroup
            propertyEntry={propertyEntry}
            key={propertyEntry.key}
            roomContext={props.roomContext}
          ></PropertyGroup>
        ))}
      </Collapsable>
    </Stack>
  );
}
