import { Node } from "../../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { useEffect } from "react";

export function NodeDetails(props: { node: Node; context: AppContext }) {
  const webSockets = props.context.webSocketsManager;
  const removeInspectorElement = useBearStore(
    (s) => s.room.panels.inspector.removeElement,
  );
  const graph = useBearStore((s) => s.room.scenario.graph);

  // Hide inspector if node does not exist;
  useEffect(() => {
    if (
      graph.nodes.find((existingNode) => existingNode.id === props.node.id) ==
      null
    ) {
      removeInspectorElement();
    }
  }, [graph]);

  return (
    <DetailPane
      actions={[
        {
          title: "Expand",
          icon: "zoom-in",
          variant: "primary",
          action: () => {
            webSockets.sendMessage({
              type: "WSActionExpandNodes",
              nodes: [props.node.id],
            });
          },
        },
        {
          title: "Remove",
          icon: "eye-slash",
          variant: "danger",
          action: () => {
            webSockets.sendMessage({
              type: "WSActionDeleteNodes",
              nodes: [props.node.id],
            });
            removeInspectorElement();
          },
        },
        ...(props.node.locked
          ? [
              {
                title: "Unlock",
                icon: "unlock",
                variant: "primary",
                action: () => {
                  webSockets.sendMessage({
                    type: "WSActionUnlockNodes",
                    nodes: [props.node.id],
                  });
                },
              } satisfies DetailPaneAction,
            ]
          : []),
      ]}
      otherProperties={[
        {
          slug: "ID",
          value: props.node.id,
        },
        {
          slug: "Labels",
          value: props.node.labels,
        },
        {
          slug: "Source",
          value: props.node.source,
        },
        {
          slug: "Additional Sources",
          value: props.node.additionalSources,
        },
        {
          slug: "Names in Query",
          value: props.node.namesInQuery,
        },
        {
          slug: "Degree",
          value: props.node.degree,
        },
      ]}
      properties={props.node.properties}
      title={props.node.title}
    ></DetailPane>
  );
}
