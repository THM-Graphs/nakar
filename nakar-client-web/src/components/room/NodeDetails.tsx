import {
  Button,
  Card,
  CloseButton,
  ListGroup,
  Spinner,
  Stack,
  Table,
} from "react-bootstrap";
import { Node } from "../../../src-gen";
import { CSSProperties } from "react";

export function NodeDetails(props: {
  node: Node;
  onClose: () => void;
  onExpandNode: () => void;
  onDeleteNode: () => void;
  onUnlockNode: () => void;
  scenarioLoading: boolean;
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
            <Card.Title>{props.node.title}</Card.Title>
            <span className={"text-muted small"}>{props.node.id}</span>
            <Stack direction={"horizontal"} gap={1}>
              <Button
                size={"sm"}
                onClick={props.onExpandNode}
                disabled={props.scenarioLoading}
              >
                {props.scenarioLoading && (
                  <Spinner size={"sm"} className={"me-2"}></Spinner>
                )}
                Expand
              </Button>
              <Button
                size={"sm"}
                onClick={props.onDeleteNode}
                disabled={props.scenarioLoading}
                variant={"danger"}
              >
                {props.scenarioLoading && (
                  <Spinner size={"sm"} className={"me-2"}></Spinner>
                )}
                Delete
              </Button>
              {props.node.locked && (
                <Button
                  size={"sm"}
                  onClick={props.onUnlockNode}
                  disabled={props.scenarioLoading}
                >
                  {props.scenarioLoading && (
                    <Spinner size={"sm"} className={"me-2"}></Spinner>
                  )}
                  Unlock
                </Button>
              )}
            </Stack>
          </Stack>
          <CloseButton onClick={props.onClose}></CloseButton>
        </Stack>
      </Card.Body>
      <ListGroup className="list-group-flush">
        <ListGroup.Item>
          <h6>Labels</h6>
          {props.node.labels.join(", ")}
        </ListGroup.Item>
        <ListGroup.Item>
          <h6>Source</h6>
          {props.node.source}
        </ListGroup.Item>
        {props.node.additionalSources.length > 0 && (
          <ListGroup.Item>
            <h6>Additional Sources</h6>
            {props.node.additionalSources.join(", ")}
          </ListGroup.Item>
        )}
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
              {props.node.properties.map((property) => (
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
                <td>{props.node.namesInQuery.join(", ")}</td>
              </tr>
              <tr>
                <td>Degree</td>
                <td>{props.node.degree}</td>
              </tr>
            </tbody>
          </Table>
        </ListGroup.Item>
      </ListGroup>
    </Card>
  );
}
