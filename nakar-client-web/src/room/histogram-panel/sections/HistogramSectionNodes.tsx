import { ValueDisplay } from "../ValueDisplay.tsx";
import { useCanvasContext } from "../../../pages/Canvas.tsx";
import { useBearStore } from "../../../state/useBearStore.ts";
import { DynamicList } from "../../../shared/elements/DynamicList.tsx";
import { nodeActions } from "../../actions/groups/nodeActions.ts";
import {
  getBackgroundColorOfLabel,
  getBackgroundColorOfOptionalColor,
} from "../../color/getBackgroundColor.ts";
import { useColorSchema } from "../../color/useColorSchema.ts";
import { LabelDto } from "../../../../src-gen";
import { useIsLoggedIn } from "../../../state/useIsLoggedIn.ts";

export function HistogramSectionNodes() {
  const roomContext = useCanvasContext();
  const histogram = useBearStore((s) => s.room.scenario.graph.histogram);
  const setElement = useBearStore((s) => s.room.panels.inspector.setElement);
  const onCenter = useBearStore((s) => s.room.ui.rendererEvents.onCenter);
  const nodes = useBearStore((s) => s.room.scenario.graph.elements.nodes);
  const graphLabels = useBearStore(
    (s) => s.room.scenario.graph.elements.labels,
  );
  const colorSchema = useColorSchema();
  const isLoggedIn = useIsLoggedIn();

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
              const label: LabelDto | null =
                graphLabels.find((gl) => gl.label === l) ?? null;
              return getBackgroundColorOfLabel(label, colorSchema);
            });
            const customColor: string | null =
              getBackgroundColorOfOptionalColor(
                nodeEntry.customColor,
                colorSchema,
              );
            return (
              <ValueDisplay
                key={nodeEntry.id}
                value={nodeEntry.degree}
                percentage={nodeEntry.percentage}
                label={nodeEntry.title}
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
                      roomContext: roomContext,
                      isLoggedIn: isLoggedIn,
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
