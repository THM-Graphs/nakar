import { Edge } from "../../../../src-gen";
import { DetailPane } from "./DetailPane.tsx";
import { Pane } from "../Pane/Pane.tsx";

export function EdgeDetails(props: { edge: Edge | null; onClose: () => void }) {
  return (
    <Pane
      direction={"right"}
      hidden={!props.edge}
      onClose={props.onClose}
      title={"Edge"}
    >
      {props.edge ? (
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
      ) : (
        <>
          <div className={"flex-grow-1"}></div>
          <span className={"text-muted small text-center"}>
            No edge selected
          </span>
          <div className={"flex-grow-1"}></div>
        </>
      )}
    </Pane>
  );
}
