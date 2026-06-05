import { DetailPane } from "./DetailPane.tsx";
import { useCanvasContext } from "../../pages/Canvas.tsx";
import { Stack } from "react-bootstrap";
import { NodePreviewDisplay } from "./NodePreviewDisplay.tsx";
import { relationshipActions } from "../actions/groups/relationshipActions.ts";
import { EdgeDto } from "api-client";
import { PropertyEntry } from "./PropertiesDisplay.tsx";
import { EdgeViewSettingsEditor } from "../visualization-panel/EdgeViewSettingsEditor.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";

export function EdgeDetails(props: { edge: EdgeDto }) {
  const roomContext = useCanvasContext();
  const properties: PropertyEntry[] = Object.entries(
    props.edge.properties satisfies Record<string, unknown>,
  ).map(([key, value]) => ({
    slug: key,
    value: value,
  }));

  return (
    <Stack>
      <DetailPane
        actions={relationshipActions.map((a) =>
          a.detailPaneAction(() => ({
            edges: [props.edge],
            roomContext: roomContext,
          })),
        )}
        otherProperties={[
          {
            slug: "ID",
            value: props.edge.id,
          },
          {
            slug: "Native ID",
            value: props.edge.nativeId,
          },
          {
            slug: "Source",
            value: props.edge.sourceTitle,
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
        properties={properties}
        title={props.edge.type}
        elementId={props.edge.id}
        subTitleElements={
          <Stack
            direction={"horizontal"}
            gap={2}
            className={"justify-content-start p-1"}
          >
            <NodePreviewDisplay
              node={props.edge.sourceNode}
            ></NodePreviewDisplay>
            <i className={"bi bi-arrow-right flex-grow-0"}></i>
            <NodePreviewDisplay
              node={props.edge.targetNode}
            ></NodePreviewDisplay>
          </Stack>
        }
      >
        <Collapsable
          title={<span className={"fw-bold small"}>Visualization</span>}
          className={"border-bottom"}
          collapsed={true}
        >
          <Stack className={"p-1"}>
            <EdgeViewSettingsEditor
              edgeType={props.edge.type}
            ></EdgeViewSettingsEditor>
          </Stack>
        </Collapsable>
      </DetailPane>
    </Stack>
  );
}
