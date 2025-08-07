import { match } from "ts-pattern";
import { Panel } from "../Panel.tsx";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { Collapsable } from "../../Collapsable.tsx";
import { Edge, Node } from "../../../../../src-gen";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { deleteNodes } from "../../../../actions/deleteNodes.ts";
import { focusNodes } from "../../../../actions/focusNodes.ts";
import { DynamicList } from "../../../shared/DynamicList.tsx";
import { Stack } from "react-bootstrap";
import { deleteEdges } from "../../../../actions/deleteEdges.ts";
import { NodeLabelColors } from "../../../shared/NodeLabelColors.tsx";
import { unlockNodes } from "../../../../actions/unlockNodes.ts";

export function InspectorPanel(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const rightPanel = useBearStore((s) => s.room.panels.right);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  const elements = inspector.element.reduce<(Node | Edge)[]>((akku, next) => {
    const foundElement =
      graphElements.nodes.find((n) => n.id === next) ??
      graphElements.edges.find((e) => e.id === next);
    if (foundElement) {
      return [...akku, foundElement];
    } else {
      return akku;
    }
  }, []);
  return (
    <Panel
      direction={"right"}
      hidden={rightPanel !== "inspector"}
      onClose={() => {
        inspector.hide();
      }}
      title={"Inspector"}
    >
      {match(elements.length)
        .with(0, () => <EmptyInspector></EmptyInspector>)
        .with(1, () => {
          const firstElement = elements[0];
          return (
            <InspectorForType
              element={firstElement}
              roomContext={props.roomContext}
              context={props.context}
            ></InspectorForType>
          );
        })
        .otherwise(() => {
          const nodes: Node[] = elements.reduce<Node[]>(
            (akku, next) => ("labels" in next ? [...akku, next] : akku),
            [],
          );
          const edges: Edge[] = elements.reduce<Edge[]>(
            (akku, next) => ("startNodeId" in next ? [...akku, next] : akku),
            [],
          );
          const oneOrMoreNodesAreUnlockable =
            nodes.find((n) => n.locked) != null;
          return (
            <Stack gap={5}>
              {nodes.length > 0 && (
                <DynamicList
                  data={nodes}
                  render={(list) => (
                    <>
                      {list.map((element) => (
                        <InspectorPanelForMultiType
                          element={element}
                          roomContext={props.roomContext}
                          context={props.context}
                          key={element.id}
                        ></InspectorPanelForMultiType>
                      ))}
                      {list.length > 0 && (
                        <>
                          <NavbarButton
                            title={`Remove ${nodes.length.toString()} nodes`}
                            className={"border-top"}
                            icon={"eye-slash"}
                            onClick={async () => {
                              await deleteNodes(nodes, props.roomContext);
                            }}
                          ></NavbarButton>
                          <NavbarButton
                            title={`Focus on ${nodes.length.toString()} nodes`}
                            className={"border-top"}
                            icon={"binoculars"}
                            onClick={async () => {
                              await focusNodes(nodes, props.roomContext);
                            }}
                          ></NavbarButton>
                          <NavbarButton
                            title={`Unlock ${nodes.length.toString()} nodes`}
                            className={"border-top border-bottom"}
                            disabled={!oneOrMoreNodesAreUnlockable}
                            icon={"unlock"}
                            onClick={async () => {
                              await unlockNodes(nodes, props.roomContext);
                            }}
                          ></NavbarButton>
                        </>
                      )}
                    </>
                  )}
                  entityNamePlural={"Nodes"}
                ></DynamicList>
              )}
              {edges.length > 0 && (
                <DynamicList
                  data={edges}
                  render={(list) => (
                    <>
                      {list.map((element) => (
                        <InspectorPanelForMultiType
                          element={element}
                          roomContext={props.roomContext}
                          context={props.context}
                          key={element.id}
                        ></InspectorPanelForMultiType>
                      ))}
                      {list.length > 0 && (
                        <>
                          <NavbarButton
                            title={`Remove ${edges.length.toString()} edges`}
                            className={"border-top border-bottom"}
                            icon={"eye-slash"}
                            onClick={async () => {
                              await deleteEdges(edges, props.roomContext);
                            }}
                          ></NavbarButton>
                        </>
                      )}
                    </>
                  )}
                  entityNamePlural={"Edges"}
                ></DynamicList>
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
    <span className={"text-muted small fst-italic align-self-center"}>
      Inspector
    </span>
  );
}

function InspectorForType(props: {
  element: Node | Edge;
  roomContext: RoomContext;
  context: AppContext;
}) {
  if ("title" in props.element) {
    return (
      <NodeDetails
        context={props.context}
        node={props.element}
        roomContext={props.roomContext}
      ></NodeDetails>
    );
  } else {
    return (
      <EdgeDetails
        edge={props.element}
        roomContext={props.roomContext}
      ></EdgeDetails>
    );
  }
}

function InspectorPanelForMultiType(props: {
  element: Node | Edge;
  roomContext: RoomContext;
  context: AppContext;
}) {
  const title =
    "title" in props.element ? props.element.title : props.element.type;
  return (
    <Collapsable
      title={
        <Stack direction={"horizontal"}>
          {"title" in props.element ? (
            <NodeLabelColors labels={props.element.labels}></NodeLabelColors>
          ) : null}
          <span className={"small ellipsis"}>{title}</span>
        </Stack>
      }
      className={"flex-grow-0"}
    >
      <InspectorForType
        element={props.element}
        roomContext={props.roomContext}
        context={props.context}
      ></InspectorForType>
    </Collapsable>
  );
}
