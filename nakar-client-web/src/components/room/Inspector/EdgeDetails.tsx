import { Edge } from "../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";

export function EdgeDetails(props: { edge: Edge }) {
  return (
    <DetailPane
      actions={[]}
      loading={false}
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
          slug: "Loop?",
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
          slug: "Compressed Count",
          value: props.edge.compressedCount,
        },
      ]}
      properties={props.edge.properties}
      title={props.edge.type}
    ></DetailPane>
  );
}
