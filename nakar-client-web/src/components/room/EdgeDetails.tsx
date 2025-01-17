import { Card, CloseButton, ListGroup, Stack, Table } from "react-bootstrap";
import { Edge } from "../../../src-gen";
import { CSSProperties } from "react";

export function EdgeDetails(props: {
  edge: Edge;
  onClose: () => void;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Card
      style={{ ...props.style, width: "400px" }}
      className={props.className ?? "" + " overflow-auto "}
    >
      <Card.Body>
        <Stack
          direction={"horizontal"}
          className={"justify-content-between align-items-baseline"}
        >
          <Stack>
            <Card.Title>{props.edge.type}</Card.Title>
            <span className={"text-muted small"}>{props.edge.id}</span>
          </Stack>
          <CloseButton onClick={props.onClose}></CloseButton>
        </Stack>
      </Card.Body>
      <ListGroup className="list-group-flush">
        <ListGroup.Item>
          <h6>Properties</h6>
          <Table>
            <thead>
              <tr>
                <th>Key</th>
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
        </ListGroup.Item>
        <ListGroup.Item>
          <h6>Others</h6>
          <Table>
            <thead>
              <tr>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
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
        </ListGroup.Item>
      </ListGroup>
    </Card>
  );
}
