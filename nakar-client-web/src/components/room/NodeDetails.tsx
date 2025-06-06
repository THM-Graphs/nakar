import { Node } from "../../../src-gen";
import { DetailPane } from "./DetailPane/DetailPane.tsx";
import { DetailPaneAction } from "./DetailPane/DetailPaneAction.ts";

export function NodeDetails(props: {
  node: Node;
  onClose: () => void;
  onExpandNode: () => void;
  onDeleteNode: () => void;
  onUnlockNode: () => void;
  scenarioLoading: boolean;
}) {
  return (
    <DetailPane
      actions={[
        {
          title: "Expand",
          icon: "zoom-in",
          variant: "primary",
          action: props.onExpandNode,
        },
        {
          title: "Remove",
          icon: "eye-slash",
          variant: "danger",
          action: props.onDeleteNode,
        },
        ...(props.node.locked
          ? [
              {
                title: "Unlock",
                icon: "unlock",
                variant: "primary",
                action: props.onUnlockNode,
              } satisfies DetailPaneAction,
            ]
          : []),
      ]}
      entityTitle={"Node"}
      loading={props.scenarioLoading}
      onClose={props.onClose}
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
