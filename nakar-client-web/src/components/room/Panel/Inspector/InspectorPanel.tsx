import { match } from "ts-pattern";
import { Panel } from "../Panel.tsx";
import { ReactNode, useEffect } from "react";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function InspectorPanel(props: {
  context: AppContext;
  roomContext: RoomContext;
}) {
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);

  return (
    <Panel
      direction={"right"}
      hidden={!inspector.shown}
      onClose={() => {
        inspector.hide();
      }}
      title={match(inspector.element)
        .with({ type: "node" }, () => "Node")
        .with({ type: "edge" }, () => "Edge")
        .with(null, () => "Inspector")
        .exhaustive()}
    >
      {match(inspector.element)
        .returnType<ReactNode>()
        .with({ type: "node" }, ({ nodeId }) => {
          const node = graphElements.nodes.find((n) => n.id === nodeId);
          return node ? (
            <NodeDetails
              context={props.context}
              node={node}
              roomContext={props.roomContext}
            ></NodeDetails>
          ) : (
            <EmptyInspector></EmptyInspector>
          );
        })
        .with({ type: "edge" }, ({ edgeId }) => {
          const edge = graphElements.edges.find((n) => n.id === edgeId);
          return edge ? (
            <EdgeDetails edge={edge}></EdgeDetails>
          ) : (
            <EmptyInspector></EmptyInspector>
          );
        })
        .with(null, () => <EmptyInspector></EmptyInspector>)
        .exhaustive()}
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
