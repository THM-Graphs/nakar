import { match } from "ts-pattern";
import { Panel } from "../Panel.tsx";
import { ReactNode } from "react";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";

export function InspectorPanel(props: { context: AppContext }) {
  const inspector = useBearStore((s) => s.room.panels.inspector);

  return (
    <Panel
      direction={"right"}
      hidden={!inspector.shown}
      onClose={() => {
        inspector.hide();
      }}
      title={"Inspector"}
    >
      {match(inspector.element)
        .returnType<ReactNode>()
        .with({ type: "node" }, ({ node }) => (
          <NodeDetails context={props.context} node={node}></NodeDetails>
        ))
        .with({ type: "edge" }, ({ edge }) => (
          <EdgeDetails edge={edge}></EdgeDetails>
        ))
        .with(null, () => (
          <span className={"text-muted small fst-italic align-self-center"}>
            Inspector
          </span>
        ))
        .exhaustive()}
    </Panel>
  );
}
