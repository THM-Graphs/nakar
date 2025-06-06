import { Button, CloseButton, Spinner, Stack, Table } from "react-bootstrap";
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
    <Stack
      style={{ ...props.style, width: "400px", height: "100%" }}
      className={
        props.className ??
        "" + " border-start bg-body flex-shrink-0 flex-grow-0 align-items-start"
      }
    >
      <Stack
        direction={"horizontal"}
        className={"border-bottom justify-content-between flex-0"}
      >
        <span className={"ms-2 text-muted"}>Node Information</span>
        <CloseButton className={"m-1"} onClick={props.onClose}></CloseButton>
      </Stack>
      <Stack className={"overflow-auto flex-shrink-1"}>
        <Stack className={"p-2 flex-grow-0"}>
          <h5 style={{ overflowWrap: "anywhere" }}>{props.node.title}</h5>
          <span
            className={"text-muted small"}
            style={{ textOverflow: "ellipsis", whiteSpace: "nowrap" }}
          >
            {props.node.id}
          </span>
          <Stack direction={"horizontal"} gap={1} className={"mt-2"}>
            <Button
              size={"sm"}
              onClick={props.onExpandNode}
              disabled={props.scenarioLoading}
            >
              {props.scenarioLoading && (
                <Spinner size={"sm"} className={"me-2"}></Spinner>
              )}
              <i className={"bi bi-zoom-in me-1"}></i>
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
              <i className={"bi bi-eye-slash me-1"}></i>
              Remove
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
                <i className={"bi bi-unlock me-1"}></i>
                Unlock
              </Button>
            )}
          </Stack>
        </Stack>
        <Table>
          <thead>
            <tr>
              <th>Property</th>
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
        <Table>
          <thead>
            <tr>
              <th>Other Property</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Labels</td>
              <td>{props.node.labels.join(", ")}</td>
            </tr>
            <tr>
              <td>Source</td>
              <td>{props.node.source}</td>
            </tr>
            {props.node.additionalSources.length > 0 && (
              <tr>
                <td>Additional Sources</td>
                <td>{props.node.additionalSources.join(", ")}</td>
              </tr>
            )}
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
      </Stack>
    </Stack>
  );
}
