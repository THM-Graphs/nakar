import { PropertyGroup } from "../PropertyGroup.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { RoomContext } from "../../../pages/Room.tsx";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";

export function HistogramSectionRelationshipProperties(props: {
  roomContext: RoomContext;
}) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );

  return (
    <DynamicList
      className={"border-top"}
      data={histogram.edgeProperties}
      entityNamePlural={"Relationship Properties"}
      filter={(exp, rp) => rp.key.toLowerCase().includes(exp.toLowerCase())}
      render={(list) => (
        <>
          {list.map((propertyEntry) => (
            <PropertyGroup
              roomContext={props.roomContext}
              propertyEntry={propertyEntry}
              key={propertyEntry.key}
            ></PropertyGroup>
          ))}
        </>
      )}
    ></DynamicList>
  );
}
