import { match } from "ts-pattern";
import { Panel } from "../../shared/elements/Panel.tsx";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { useCanvasContext } from "../../pages/CanvasPage.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { Stack } from "react-bootstrap";
import { NodeLabelColors } from "../labels/NodeLabelColors.tsx";
import { ActionNavbarButton } from "../actions/ActionNavbarButton.tsx";
import { nodeActions } from "../actions/groups/nodeActions.ts";
import { relationshipActions } from "../actions/groups/relationshipActions.ts";
import {
  getBackgroundColorOfColor,
  getBackgroundColorOfLabel,
} from "../color/getBackgroundColor.ts";
import { useColorSchema } from "../color/useColorSchema.ts";
import { EdgeDto, NodeDto } from "../../../src-gen";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";

export function InspectorPanel() {
  const roomContext = useCanvasContext();
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  const elements = inspector.element.reduce<(NodeDto | EdgeDto)[]>(
    (akku, next) => {
      const foundElement =
        graphElements.nodes.find((n) => n.id === next) ??
        graphElements.edges.find((e) => e.id === next);
      if (foundElement) {
        return [...akku, foundElement];
      } else {
        return akku;
      }
    },
    [],
  );
  const isLoggedIn = useIsLoggedIn();

  return (
    <Panel
      direction={"right"}
      onClose={() => {
        inspector.hide();
      }}
      title={"Inspector"}
    >
      {match(elements.length)
        .with(0, () => <EmptyInspector></EmptyInspector>)
        .with(1, () => {
          const firstElement = elements[0];
          return <InspectorForType element={firstElement}></InspectorForType>;
        })
        .otherwise(() => {
          const nodes: NodeDto[] = elements.reduce<NodeDto[]>(
            (akku, next) => ("labels" in next ? [...akku, next] : akku),
            [],
          );
          const edges: EdgeDto[] = elements.reduce<EdgeDto[]>(
            (akku, next) => ("startNodeId" in next ? [...akku, next] : akku),
            [],
          );
          return (
            <Stack gap={5}>
              {nodes.length > 0 && (
                <Stack className={"flex-grow-0"}>
                  {nodeActions.map((action) => (
                    <ActionNavbarButton
                      action={action}
                      key={action.slug()}
                      params={{
                        nodes: nodes,
                        roomContext: roomContext,
                        isLoggedIn: isLoggedIn,
                      }}
                    ></ActionNavbarButton>
                  ))}
                  <DynamicList
                    data={nodes}
                    render={(list) => (
                      <>
                        {list.map((element) => (
                          <InspectorPanelForMultiType
                            element={element}
                            key={element.id}
                          ></InspectorPanelForMultiType>
                        ))}
                      </>
                    )}
                    entityNamePlural={"Selected Nodes"}
                  ></DynamicList>
                </Stack>
              )}
              {edges.length > 0 && (
                <Stack className={"flex-grow-0"}>
                  {relationshipActions.map((action) => (
                    <ActionNavbarButton
                      action={action}
                      key={action.slug()}
                      params={{
                        edges: edges,
                        roomContext: roomContext,
                      }}
                    ></ActionNavbarButton>
                  ))}
                  <DynamicList
                    data={edges}
                    render={(list) => (
                      <>
                        {list.map((element) => (
                          <InspectorPanelForMultiType
                            element={element}
                            key={element.id}
                          ></InspectorPanelForMultiType>
                        ))}
                      </>
                    )}
                    entityNamePlural={"Selected Relationships"}
                  ></DynamicList>
                </Stack>
              )}
              <div className={"flex-grow-1"}></div>
            </Stack>
          );
        })}
    </Panel>
  );
}

function EmptyInspector() {
  return (
    <span className={"text-muted small fst-italic align-self-center p-5"}>
      Inspector
    </span>
  );
}

function InspectorForType(props: { element: NodeDto | EdgeDto }) {
  if ("title" in props.element) {
    return <NodeDetails node={props.element}></NodeDetails>;
  } else {
    return <EdgeDetails edge={props.element}></EdgeDetails>;
  }
}

function InspectorPanelForMultiType(props: { element: NodeDto | EdgeDto }) {
  const title =
    "title" in props.element ? props.element.title : props.element.type;
  const colorSchema = useColorSchema();
  const graphLabels = useBearStore(
    (s) => s.room.scenario.graph.elements.labels,
  );

  return (
    <Collapsable
      title={
        <Stack direction={"horizontal"} className={"ellipsis"}>
          {"title" in props.element ? (
            <NodeLabelColors
              colors={
                props.element.customColor
                  ? [
                      getBackgroundColorOfColor(
                        props.element.customColor,
                        colorSchema,
                      ),
                    ]
                  : props.element.labels.map((next) => {
                      const label =
                        graphLabels.find((gl) => gl.label === next) ?? null;
                      return getBackgroundColorOfLabel(label, colorSchema);
                    }, [])
              }
            ></NodeLabelColors>
          ) : null}
          <span className={"small ellipsis"}>{title}</span>
        </Stack>
      }
      className={"flex-grow-0"}
    >
      <InspectorForType element={props.element}></InspectorForType>
    </Collapsable>
  );
}
