import { CloseButton, Stack, Table } from "react-bootstrap";
import { Edge } from "../../../src-gen";
import { CSSProperties } from "react";

export function EdgeDetails(props: {
  edge: Edge;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Stack
      style={{ ...props.style, width: "400px", height: "100%" }}
      className={
        props.className ??
        "" + " border-start bg-body flex-shrink-0 flex-grow-0"
      }
    >
      <Stack
        direction={"horizontal"}
        className={
          "border-bottom justify-content-between flex-shrink-0 flex-grow-0"
        }
      >
        <span className={"ms-2 text-muted"}>Edge Information</span>
        <CloseButton
          className={"flex-shrink-0 m-1"}
          onClick={props.onClose}
        ></CloseButton>
      </Stack>
      <Stack className={"overflow-auto"}>
        <Stack className={"p-2 flex-grow-0"}>
          <h5 style={{ overflowWrap: "anywhere" }}>{props.edge.type}</h5>
          <span
            className={"text-muted small"}
            style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {props.edge.id}
          </span>
        </Stack>
        <Table>
          <thead>
            <tr>
              <th>Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {props.edge.properties.map((property) => (
              <tr key={property.slug}>
                <td>{property.slug}</td>
                <td className={"text-break"}>
                  {JSON.stringify(property.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <Table>
          <thead>
            <tr>
              <th>Other Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Source</td>
              <td>{props.edge.source}</td>
            </tr>
            <tr>
              <td>Names in Query</td>
              <td>{props.edge.namesInQuery.join(", ")}</td>
            </tr>
            <tr>
              <td>Start Node ID</td>
              <td>{props.edge.startNodeId}</td>
            </tr>
            <tr>
              <td>End Node ID</td>
              <td>{props.edge.endNodeId}</td>
            </tr>
            <tr>
              <td>Loop?</td>
              <td>{props.edge.isLoop ? "true" : "false"}</td>
            </tr>
            <tr>
              <td>Parallel Index</td>
              <td>{props.edge.parallelIndex}</td>
            </tr>
            <tr>
              <td>Parallel Count</td>
              <td>{props.edge.parallelCount}</td>
            </tr>
            <tr>
              <td>Compressed Count</td>
              <td>{props.edge.compressedCount}</td>
            </tr>
          </tbody>
        </Table>
      </Stack>
    </Stack>
  );
}
