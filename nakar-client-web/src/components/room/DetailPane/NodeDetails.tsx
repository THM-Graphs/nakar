import { Node } from "../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { Panel } from "../Pane/Panel.tsx";

export function NodeDetails(props: {
  node: Node | null;
  onClose: () => void;
  onExpandNode: (node: Node) => void;
  onDeleteNode: (node: Node) => void;
  onUnlockNode: (node: Node) => void;
  scenarioLoading: boolean;
}) {
  return (
    <Panel
      direction={"right"}
      hidden={!props.node}
      onClose={props.onClose}
      title={"Node"}
    >
      {props.node ? (
        <DetailPane
          actions={[
            {
              title: "Expand",
              icon: "zoom-in",
              variant: "primary",
              action: () => {
                if (props.node) props.onExpandNode(props.node);
              },
            },
            {
              title: "Remove",
              icon: "eye-slash",
              variant: "danger",
              action: () => {
                if (props.node) props.onDeleteNode(props.node);
              },
            },
            ...(props.node.locked
              ? [
                  {
                    title: "Unlock",
                    icon: "unlock",
                    variant: "primary",
                    action: () => {
                      if (props.node) props.onUnlockNode(props.node);
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
      ) : (
        <>
          <div className={"flex-grow-1"}></div>
          <span className={"text-muted small text-center"}>
            No node selected
          </span>
          <div className={"flex-grow-1"}></div>
        </>
      )}
    </Panel>
  );
}
