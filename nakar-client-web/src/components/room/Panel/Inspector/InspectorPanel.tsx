import { match } from "ts-pattern";
import { Panel } from "../Panel.tsx";
import { ReactNode } from "react";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";

export function InspectorPanel(props: { context: AppContext }) {
  const inspector = useBearStore((s) => s.room.panels.inspector);
  const graph = useBearStore((s) => s.room.scenario.graph);

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
          const node = graph.nodes.find((n) => n.id === nodeId);
          return node ? (
            <NodeDetails context={props.context} node={node}></NodeDetails>
          ) : (
            <EmptyInspector></EmptyInspector>
          );
        })
        .with({ type: "edge" }, ({ edgeId }) => {
          const edge = graph.edges.find((n) => n.id === edgeId);
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
