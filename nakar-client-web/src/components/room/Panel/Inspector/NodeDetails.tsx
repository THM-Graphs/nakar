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
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { DynamicList } from "../../../shared/DynamicList.tsx";
import { ValueDisplay } from "../Histogram/ValueDisplay.tsx";

export function NodeDetails(props: {
  node: Node;
  context: AppContext;
  roomContext: RoomContext;
}) {
  const showExpandNodePreview = useBearStore(
    (s) => s.room.scenario.expandNodePreview.open,
  );

  return (
    <DetailPane
      actions={[
        {
          title: "Expand",
          icon: "zoom-in",
          variant: "primary",
          disabled: false,
          action: async () => {
            const result = resultOrThrow(
              await postRoomActionExpandNode({
                path: {
                  id: props.roomContext.initialRoomData.id,
                },
                body: { nodeId: props.node.id, limit: null },
              }),
            );
            if (result != null) {
              showExpandNodePreview({
                relationships: result.relationships,
                labels: result.labels,
                nodeId: props.node.id,
              });
            }
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
        {
          slug: "Incoming Degree",
          value: props.node.inDegree,
        },
        {
          slug: "Outgoing Degree",
          value: props.node.outDegree,
        },
        {
          slug: "Cluster Size",
          value: props.node.clusterSize,
        },
        {
          slug: "Is Cluster?",
          value: props.node.isCluster,
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
    >
      <DynamicList
        data={props.node.incomingEdges}
        filter={(exp, e) => e.type.toLowerCase().includes(exp.toLowerCase())}
        entityNamePlural={"Incoming Edges"}
        render={(list) => (
          <>
            {list.map((entry) => (
              <ValueDisplay
                key={entry.type}
                value={entry.count}
                label={entry.type}
                roomContext={props.roomContext}
                percentage={entry.percentage}
              ></ValueDisplay>
            ))}
          </>
        )}
      ></DynamicList>
      <DynamicList
        data={props.node.outgoingEdges}
        filter={(exp, e) => e.type.toLowerCase().includes(exp.toLowerCase())}
        entityNamePlural={"Outgoing Edges"}
        render={(list) => (
          <>
            {list.map((entry) => (
              <ValueDisplay
                key={entry.type}
                value={entry.count}
                label={entry.type}
                roomContext={props.roomContext}
                percentage={entry.percentage}
              ></ValueDisplay>
            ))}
          </>
        )}
      ></DynamicList>
    </DetailPane>
  );
}
