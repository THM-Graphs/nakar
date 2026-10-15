import { PropertyGroup } from "../PropertyGroup.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { useCanvasContext } from "../../../pages/Canvas.tsx";
import { relationshipActions } from "../../actions/groups/relationshipActions.ts";

export function HistogramSectionRelationshipProperties() {
  const roomContext = useCanvasContext();
  const histogram = useBearStore((s) => s.room.scenario.graph.histogram);
  const edges = useBearStore((s) => s.room.scenario.graph.elements.edges);
  const setElements = useBearStore((s) => s.room.panels.inspector.setElements);
  const showInspector = useBearStore((s) => s.room.panels.inspector.show);

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
              propertyEntry={{
                ...propertyEntry,
                values: propertyEntry.values.map((valueEntry) => {
                  const matchingEdges = edges.filter(
                    (edge) =>
                      Object.prototype.hasOwnProperty.call(
                        edge.properties,
                        propertyEntry.key,
                      ) &&
                      JSON.stringify(edge.properties[propertyEntry.key]) ===
                        valueEntry.value,
                  );

                  return {
                    ...valueEntry,
                    onSelect: () => {
                      setElements(matchingEdges.map((edge) => edge.id));
                      showInspector();
                    },
                    customActions: relationshipActions.map((action) =>
                      action.detailPaneAction(() => ({
                        edges: matchingEdges,
                        roomContext: roomContext,
                      })),
                    ),
                  };
                }),
              }}
              key={propertyEntry.key}
            ></PropertyGroup>
          ))}
        </>
      )}
    ></DynamicList>
  );
}
