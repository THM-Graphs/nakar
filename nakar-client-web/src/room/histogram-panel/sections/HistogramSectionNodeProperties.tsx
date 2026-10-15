import { PropertyGroup } from "../PropertyGroup.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { useCanvasContext } from "../../../pages/Canvas.tsx";
import { useIsLoggedIn } from "../../../state/useIsLoggedIn.ts";
import { nodeActions } from "../../actions/groups/nodeActions.ts";
import { useMemo } from "react";

export function HistogramSectionNodeProperties() {
  const roomContext = useCanvasContext();
  const isLoggedIn = useIsLoggedIn();
  const histogram = useBearStore((s) => s.room.scenario.graph.histogram);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const nodesById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  );
  const setElements = useBearStore((s) => s.room.panels.inspector.setElements);
  const showInspector = useBearStore((s) => s.room.panels.inspector.show);

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
              propertyEntry={{
                ...propertyEntry,
                values: propertyEntry.values.map((valueEntry) => {
                  const matchingNodes = valueEntry.elementIds.flatMap((id) => {
                    const node = nodesById.get(id);
                    return node ? [node] : [];
                  });

                  return {
                    ...valueEntry,
                    onSelect: () => {
                      setElements(valueEntry.elementIds);
                      showInspector();
                    },
                    customActions: nodeActions.map((action) =>
                      action.detailPaneAction(() => ({
                        nodes: matchingNodes,
                        roomContext: roomContext,
                        isLoggedIn: isLoggedIn,
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
