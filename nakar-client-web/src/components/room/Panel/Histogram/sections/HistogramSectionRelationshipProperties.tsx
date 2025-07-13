import { Collapsable } from "../../../Collapsable.tsx";
import { EmptyHint } from "../EmptyHint.tsx";
import { PropertyGroup } from "../PropertyGroup.tsx";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { RoomContext } from "../../../../../pages/Room.tsx";

export function HistogramSectionRelationshipProperties(props: {
  roomContext: RoomContext;
}) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );

  return (
    <Stack className={"border-bottom"}>
      <Collapsable
        title={<span className={"fw-bold small"}>Relationship Properties</span>}
        initialState={false}
      >
        <EmptyHint list={histogram.edgeProperties}></EmptyHint>
        {histogram.edgeProperties.map((propertyEntry) => (
          <PropertyGroup
            roomContext={props.roomContext}
            propertyEntry={propertyEntry}
            key={propertyEntry.key}
          ></PropertyGroup>
        ))}
      </Collapsable>
    </Stack>
  );
}
