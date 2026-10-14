import { ValueDisplay } from "../ValueDisplay.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { relationshipTypeActions } from "../../actions/groups/relationshipTypeActions.ts";
import { useCanvasContext } from "../../../pages/Canvas.tsx";
import { RelationshipTypeActionParams } from "../../actions/RelationshipTypeActionParams.ts";

export function HistogramSectionRelationships() {
  const roomContext = useCanvasContext();
  const histogram = useBearStore((s) => s.room.scenario.graph.histogram);
  const edges = useBearStore((s) => s.room.scenario.graph.elements.edges);
  const setElements = useBearStore((s) => s.room.panels.inspector.setElements);
  const showInspector = useBearStore((s) => s.room.panels.inspector.show);

  return (
    <DynamicList
      className={"border-top"}
      data={histogram.edgeTypes}
      entityNamePlural={"Relationship Types"}
      filter={(exp, rt) => rt.value.toLowerCase().includes(exp.toLowerCase())}
      render={(list) => (
        <>
          {list.map((entry) => (
            <ValueDisplay
              label={entry.value}
              value={entry.count}
              percentage={entry.percentage}
              key={entry.value}
              onSelect={() => {
                setElements(
                  edges
                    .filter((edge) => edge.type === entry.value)
                    .map((edge) => edge.id),
                );
                showInspector();
              }}
              customActions={relationshipTypeActions.map((action) =>
                action.detailPaneAction(() => {
                  return {
                    relationshipTypes: [entry.value],
                    roomContext: roomContext,
                  } satisfies RelationshipTypeActionParams;
                }),
              )}
            ></ValueDisplay>
          ))}
        </>
      )}
    ></DynamicList>
  );
}
