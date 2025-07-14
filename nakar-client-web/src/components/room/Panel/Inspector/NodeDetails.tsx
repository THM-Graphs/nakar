import {
  Node,
  postRoomActionDeleteElements,
  postRoomActionExpandNode,
  postRoomActionFocusNodes,
  postRoomActionUnlockNodes,
} from "../../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { Stack } from "react-bootstrap";
import { Label } from "../../Canvas/Label.tsx";

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
          disabled: false,
          action: async () => {
            resultOrThrow(
              await postRoomActionExpandNode({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
                body: { nodeId: props.node.id, limit: null },
              }),
            );
          },
        },
        {
          title: "Remove",
          icon: "eye-slash",
          variant: "danger",
          disabled: false,
          action: async () => {
            resultOrThrow(
              await postRoomActionDeleteElements({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
                body: {
                  nodes: [props.node.id],
                  labels: [],
                  edges: [],
                  edgeTypes: [],
                },
              }),
            );
          },
        },
        {
          title: "Focus",
          icon: "binoculars",
          variant: "primary",
          disabled: false,
          action: async () => {
            resultOrThrow(
              await postRoomActionFocusNodes({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
                body: { nodes: [props.node.id] },
              }),
            );
          },
        },
        {
          title: "Unlock",
          icon: "unlock",
          variant: "primary",
          disabled: !props.node.locked,
          action: async () => {
            resultOrThrow(
              await postRoomActionUnlockNodes({
                path: { id: props.roomContext.initialRoomData.id },
                body: {
                  nodes: [props.node.id],
                },
              }),
            );
          },
        },
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
      subTitleElements={
        <Stack
          direction={"horizontal"}
          className={"p-2 flex-wrap flex-shrink-0 flex-grow-0"}
          gap={1}
        >
          {props.node.labels.map((label: string) => {
            return (
              <Label
                key={label}
                label={label}
                showAmount={false}
                showSources={true}
              ></Label>
            );
          })}
        </Stack>
      }
      roomContext={props.roomContext}
      elementId={props.node.id}
    ></DetailPane>
  );
}
