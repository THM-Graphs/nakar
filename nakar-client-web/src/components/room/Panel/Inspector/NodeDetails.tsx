import { Node } from "../../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";

export function NodeDetails(props: { node: Node; context: AppContext }) {
  const lockUI = useBearStore((s) => s.room.ui.lock);
  const webSockets = props.context.webSocketsManager;
  const removeInspectorElement = useBearStore(
    (s) => s.room.panels.inspector.removeElement,
  );

  return (
    <DetailPane
      entityTitle={"Node"}
      actions={[
        {
          title: "Expand",
          icon: "zoom-in",
          variant: "primary",
          action: () => {
            lockUI();
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
            lockUI();
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
