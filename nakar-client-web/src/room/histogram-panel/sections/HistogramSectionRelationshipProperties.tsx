import { PropertyGroup } from "../PropertyGroup.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";

export function HistogramSectionRelationshipProperties() {
  const histogram = useBearStore((s) => s.room.scenario.graph.histogram);

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
              propertyEntry={propertyEntry}
              key={propertyEntry.key}
            ></PropertyGroup>
          ))}
        </>
      )}
    ></DynamicList>
  );
}
