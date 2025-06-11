import { Node } from "../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { DetailPaneAction } from "./DetailPaneAction.ts";

export function NodeDetails(props: {
  node: Node;
  onExpandNode: (node: Node) => void;
  onDeleteNode: (node: Node) => void;
  onUnlockNode: (node: Node) => void;
  scenarioLoading: boolean;
}) {
  return (
    <DetailPane
      actions={[
        {
          title: "Expand",
          icon: "zoom-in",
          variant: "primary",
          action: () => {
            props.onExpandNode(props.node);
          },
        },
        {
          title: "Remove",
          icon: "eye-slash",
          variant: "danger",
          action: () => {
            props.onDeleteNode(props.node);
          },
        },
        ...(props.node.locked
          ? [
              {
                title: "Unlock",
                icon: "unlock",
                variant: "primary",
                action: () => {
                  props.onUnlockNode(props.node);
                },
              } satisfies DetailPaneAction,
            ]
          : []),
      ]}
      loading={props.scenarioLoading}
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
