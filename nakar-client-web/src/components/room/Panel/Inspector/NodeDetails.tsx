import {
  Node,
  postRoomActionDeleteElements,
  postRoomActionExpandNode,
  postRoomActionExpandNodePreview,
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
import { expandNode } from "../../../../actions/expandNode.ts";
import { deleteNodes } from "../../../../actions/deleteNodes.ts";
import { focusNodes } from "../../../../actions/focusNodes.ts";
import { unlockNodes } from "../../../../actions/unlockNodes.ts";

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
            await expandNode(props.node, props.roomContext);
          },
        },
        {
          title: "Remove",
          icon: "eye-slash",
          variant: "danger",
          disabled: false,
          action: async () => {
            await deleteNodes([props.node], props.roomContext);
          },
        },
        {
          title: "Focus",
          icon: "binoculars",
          variant: "primary",
          disabled: false,
          action: async () => {
            await focusNodes([props.node], props.roomContext);
          },
        },
        {
          title: "Unlock",
          icon: "unlock",
          variant: "primary",
          disabled: !props.node.locked,
          action: async () => {
            await unlockNodes([props.node], props.roomContext);
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
          slug: "Native Labels",
          value: props.node.nativeLabels,
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
        {
          slug: "Creation Reason",
          value: props.node.creationReason,
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
        className={"border-bottom border-top"}
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
        className={"border-bottom border-top"}
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
