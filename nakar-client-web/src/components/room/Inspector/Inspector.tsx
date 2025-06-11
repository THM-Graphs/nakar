import { Node } from "../../../../src-gen";
import { match } from "ts-pattern";
import { InspectorElement } from "./InspectorElement.ts";
import { Panel } from "../Panel/Panel.tsx";
import { ReactNode } from "react";
import { NodeDetails } from "./NodeDetails.tsx";
import { EdgeDetails } from "./EdgeDetails.tsx";

export function Inspector(props: {
  element: InspectorElement | null;
  hidden: boolean;
  onClose: () => void;
  onExpandNode: (node: Node) => void;
  onDeleteNode: (node: Node) => void;
  onUnlockNode: (node: Node) => void;
  scenarioLoading: boolean;
}) {
  return (
    <Panel
      direction={"right"}
      hidden={props.hidden}
      onClose={props.onClose}
      title={"Inspector"}
    >
      {match(props.element)
        .returnType<ReactNode>()
        .with({ type: "node" }, ({ node }) => (
          <NodeDetails
            node={node}
            onDeleteNode={props.onDeleteNode}
            onExpandNode={props.onExpandNode}
            onUnlockNode={props.onUnlockNode}
            scenarioLoading={props.scenarioLoading}
          ></NodeDetails>
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
