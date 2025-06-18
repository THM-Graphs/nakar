import {
  Node,
  postRoomActionDeleteNodes,
  postRoomActionExpandNodes,
  postRoomActionUnlockNodes,
} from "../../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";

export function NodeDetails(props: {
  node: Node;
  context: AppContext;
  roomContext: RoomContext;
}) {
  return (
    <DetailPane
      actions={[
        {
          title: "Expand",
          icon: "zoom-in",
          variant: "primary",
          action: async () => {
            await postRoomActionExpandNodes({
              path: {
                id: props.roomContext.initialRoomData.id,
              },
              body: { nodes: [props.node.id] },
            });
          },
        },
        {
          title: "Remove",
          icon: "eye-slash",
          variant: "danger",
          action: async () => {
            await postRoomActionDeleteNodes({
              path: {
                id: props.roomContext.initialRoomData.id,
              },
              body: { nodes: [props.node.id] },
            });
          },
        },
        ...(props.node.locked
          ? [
              {
                title: "Unlock",
                icon: "unlock",
                variant: "primary",
                action: async () => {
                  await postRoomActionUnlockNodes({
                    path: { id: props.roomContext.initialRoomData.id },
                    body: {
                      nodes: [props.node.id],
                    },
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
