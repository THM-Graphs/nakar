import {
  GraphLabel,
  Node,
  postRoomActionDeleteElements,
  postRoomActionExpandNode,
  postRoomActionFocusNodes,
  postRoomActionUnlockNodes,
} from "../../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { DetailPaneAction } from "./DetailPaneAction.ts";
import { AppContext } from "../../../../lib/state/AppContext.ts";
import { RoomContext } from "../../../../pages/Room.tsx";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { Stack } from "react-bootstrap";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { Label } from "../../Canvas/Label.tsx";

export function NodeDetails(props: {
  node: Node;
  context: AppContext;
  roomContext: RoomContext;
}) {
  const graphElements = useBearStore((s) => s.room.scenario.graph.elements);
  return (
    <DetailPane
      actions={[
        {
          title: "Expand",
          icon: "zoom-in",
          variant: "primary",
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
          title: "Focus",
          icon: "binoculars",
          variant: "primary",
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
          title: "Remove",
          icon: "eye-slash",
          variant: "danger",
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
        ...(props.node.locked
          ? [
              {
                title: "Unlock",
                icon: "unlock",
                variant: "primary",
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
      subTitleElements={
        <Stack
          direction={"horizontal"}
          className={"p-1 flex-wrap flex-shrink-0 flex-grow-0"}
          gap={1}
        >
          {props.node.labels.map((labelName: string) => {
            const label: GraphLabel | undefined = graphElements.labels.find(
              (l) => l.label === labelName,
            );
            if (label == null) {
              return null;
            }
            return (
              <Label
                graphElements={graphElements}
                key={labelName}
                label={label}
                showAmount={true}
              ></Label>
            );
          })}
        </Stack>
      }
      roomContext={props.roomContext}
    ></DetailPane>
  );
}
