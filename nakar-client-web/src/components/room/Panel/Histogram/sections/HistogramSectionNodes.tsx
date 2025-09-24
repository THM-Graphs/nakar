import { ValueDisplay } from "../ValueDisplay.tsx";
import { RoomContext } from "../../../../../pages/Room.tsx";
import { useBearStore } from "../../../../../lib/state/useBearStore.ts";
import { DynamicList } from "../../../../shared/DynamicList.tsx";
import { nodeActions } from "../../../../../actions/groups/nodeActions.ts";
import { GraphLabel } from "../../../../../../src-gen";
import {
  getBackgroundColorOfLabel,
  getBackgroundColorOfOptionalColor,
} from "../../../../../lib/color/getBackgroundColor.ts";
import { useColorSchema } from "../../../../../lib/color/useColorSchema.ts";

export function HistogramSectionNodes(props: { roomContext: RoomContext }) {
  const histogram = useBearStore(
    (s) => s.room.scenario.graph.elements.histogram,
  );
  const setElement = useBearStore((s) => s.room.panels.inspector.setElement);
  const onCenter = useBearStore((s) => s.room.ui.rendererEvents.onCenter);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const graphLabels = useBearStore(
    (s) => s.room.scenario.graph.elements.labels,
  );
  const colorSchema = useColorSchema();

  return (
    <DynamicList
      className={"border-top"}
      data={histogram.nodes}
      entityNamePlural={"Nodes"}
      filter={(exp, n) => n.title.toLowerCase().includes(exp.toLowerCase())}
      render={(list) => (
        <>
          {list.map((nodeEntry) => {
            const labelColors = nodeEntry.labels.map((l) => {
              const label: GraphLabel | null =
                graphLabels.find((gl) => gl.label === l) ?? null;
              return getBackgroundColorOfLabel(label, colorSchema);
            });
            const customColor: string | null =
              getBackgroundColorOfOptionalColor(
                nodeEntry.customColor?.color ?? null,
                colorSchema,
              );
            return (
              <ValueDisplay
                key={nodeEntry.id}
                roomContext={props.roomContext}
                value={nodeEntry.degree}
                percentage={nodeEntry.percentage}
                label={nodeEntry.title}
                subLabel={nodeEntry.id}
                nodeColors={customColor != null ? [customColor] : labelColors}
                onSelect={() => {
                  setElement(nodeEntry.id);
                  onCenter.next();
                }}
                customActions={nodeActions.map((action) =>
                  action.detailPaneAction(() => {
                    const node = nodes.find((n) => n.id === nodeEntry.id);
                    return {
                      nodes: node ? [node] : [],
                      roomContext: props.roomContext,
                    };
                  }),
                )}
              ></ValueDisplay>
            );
          })}
        </>
      )}
    ></DynamicList>
  );
}
