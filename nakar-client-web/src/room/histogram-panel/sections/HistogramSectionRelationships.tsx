import { CanvasContext } from "../../../pages/CanvasPage.tsx";
import { ValueDisplay } from "../ValueDisplay.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { relationshipActions } from "../../actions/groups/relationshipActions.ts";

export function HistogramSectionRelationships(props: {
  roomContext: CanvasContext;
}) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  const edges = useBearStore((s) => s.room.scenario.graph.elements.edges);

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
              roomContext={props.roomContext}
              percentage={entry.percentage}
              key={entry.value}
              customActions={relationshipActions.map((action) =>
                action.detailPaneAction(() => {
                  return {
                    edges: edges.filter((e) => e.type === entry.value),
                    roomContext: props.roomContext,
                  };
                }),
              )}
            ></ValueDisplay>
          ))}
        </>
      )}
    ></DynamicList>
  );
}
