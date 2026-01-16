import { PropertyGroup } from "../PropertyGroup.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { CanvasContext } from "../../../pages/CanvasPage.tsx";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";

export function HistogramSectionNodeProperties(props: {
  roomContext: CanvasContext;
}) {
  const histogram = useBearStore((s) => s.room.scenario.graph.histogram);

  return (
    <DynamicList
      data={histogram.nodeProperties}
      className={"border-top"}
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
  );
}
