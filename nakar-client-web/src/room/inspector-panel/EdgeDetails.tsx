import { Edge } from "../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { RoomContext } from "../../pages/Room.tsx";
import { Stack } from "react-bootstrap";
import { NodePreviewDisplay } from "./NodePreviewDisplay.tsx";
import { relationshipActions } from "../actions/groups/relationshipActions.ts";

export function EdgeDetails(props: { edge: Edge; roomContext: RoomContext }) {
  return (
    <DetailPane
      actions={relationshipActions.map((a) =>
        a.detailPaneAction(() => ({
          edges: [props.edge],
          roomContext: props.roomContext,
        })),
      )}
      otherProperties={[
        {
          slug: "ID",
          value: props.edge.id,
        },
        {
          slug: "Source",
          value: props.edge.source,
        },
        {
          slug: "Names in Query",
          value: props.edge.namesInQuery,
        },
        {
          slug: "Start Node ID",
          value: props.edge.startNodeId,
        },
        {
          slug: "End Node ID",
          value: props.edge.endNodeId,
        },
        {
          slug: "Is Loop?",
          value: props.edge.isLoop,
        },
        {
          slug: "Parallel Index",
          value: props.edge.parallelIndex,
        },
        {
          slug: "Parallel Count",
          value: props.edge.parallelCount,
        },
        {
          slug: "Cluster Size",
          value: props.edge.clusterSize,
        },
        {
          slug: "Is Cluster?",
          value: props.edge.isCluster,
        },
        {
          slug: "Source Node",
          value: props.edge.sourceNode.title,
        },
        {
          slug: "Target Node",
          value: props.edge.targetNode.title,
        },
        {
          slug: "Creation Reason",
          value: props.edge.creationReason,
        },
      ]}
      properties={props.edge.properties}
      title={props.edge.type}
      roomContext={props.roomContext}
      elementId={props.edge.id}
      subTitleElements={
        <Stack
          direction={"horizontal"}
          gap={2}
          className={"justify-content-start p-1"}
        >
          <NodePreviewDisplay node={props.edge.sourceNode}></NodePreviewDisplay>
          <i className={"bi bi-arrow-right flex-grow-0"}></i>
          <NodePreviewDisplay node={props.edge.targetNode}></NodePreviewDisplay>
        </Stack>
      }
    ></DetailPane>
  );
}
