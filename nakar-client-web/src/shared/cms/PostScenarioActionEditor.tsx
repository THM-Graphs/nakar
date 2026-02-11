import {
  Card,
  Col,
  Form,
  OverlayTrigger,
  Row,
  Stack,
  Tooltip,
} from "react-bootstrap";
import { MouseEventHandler } from "react";
import { UpdateScenarioPostActionEntryDto } from "../../../src-gen";
import { CMSButton } from "./CMSButton.tsx";

export function PostScenarioActionEditor(props: {
  value: UpdateScenarioPostActionEntryDto;
  onChange: (newEntry: UpdateScenarioPostActionEntryDto) => void;
  onDelete?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Card className={"p-3 gap-3 flex-grow-1"}>
      <Stack direction={"horizontal"} gap={3}>
        <Stack className={"flex-grow-1"} gap={3}>
          <Row>
            <Col>
              <Form.Group className="" controlId="type">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={props.value.type}
                  onChange={(e) => {
                    props.onChange({
                      ...props.value,
                      type: e.target
                        .value as UpdateScenarioPostActionEntryDto["type"],
                    });
                  }}
                >
                  <option
                    value={
                      "connectResultNodes" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Connect Result Nodes
                  </option>
                  <option
                    value={
                      "layout" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Layout Nodes
                  </option>
                  <option
                    value={
                      "compressNodes" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Compress Nodes (Cluster)
                  </option>
                  <option
                    value={
                      "compressRelationships" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Compress Relationships (Cluster)
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              {props.value.type !== "compressRelationships" &&
                props.value.type !== "connectResultNodes" && (
                  <Form.Group className="" controlId="label">
                    <Form.Label>
                      Label{" "}
                      <OverlayTrigger
                        overlay={
                          <Tooltip>Label to apply the action to.</Tooltip>
                        }
                      >
                        <i className={"bi bi-info-circle"}></i>
                      </OverlayTrigger>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Person"
                      className={"font-monospace"}
                      value={props.value.label}
                      onChange={(e) => {
                        props.onChange({
                          ...props.value,
                          label: e.target.value,
                        });
                      }}
                    />
                  </Form.Group>
                )}
            </Col>
          </Row>
          {props.value.type === "layout" && (
            <Row>
              <Col>
                <Form.Group className="" controlId="layoutAlgorithm">
                  <Form.Label>Layout Algorithm</Form.Label>
                  <Form.Select
                    value={props.value.layoutAlgorithm}
                    onChange={(e) => {
                      props.onChange({
                        ...props.value,
                        layoutAlgorithm: e.target
                          .value as UpdateScenarioPostActionEntryDto["layoutAlgorithm"],
                      });
                    }}
                  >
                    <option
                      value={
                        "circle" satisfies UpdateScenarioPostActionEntryDto["layoutAlgorithm"]
                      }
                    >
                      Circle
                    </option>
                    <option
                      value={
                        "forceDirected" satisfies UpdateScenarioPostActionEntryDto["layoutAlgorithm"]
                      }
                    >
                      Force Directed
                    </option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                {props.value.layoutAlgorithm === "circle" && (
                  <Form.Group className="" controlId="circleRadius">
                    <Form.Label>
                      Circle Radius{" "}
                      <OverlayTrigger
                        overlay={
                          <Tooltip>The radius of the circle layout</Tooltip>
                        }
                      >
                        <i className={"bi bi-info-circle"}></i>
                      </OverlayTrigger>
                    </Form.Label>
                    <Form.Control
                      placeholder="2000"
                      type={"number"}
                      value={props.value.circleRadius}
                      onChange={(e) => {
                        props.onChange({
                          ...props.value,
                          circleRadius: Number(e.target.value),
                        });
                      }}
                    />
                  </Form.Group>
                )}
              </Col>
            </Row>
          )}
        </Stack>
        {props.onDelete != null && (
          <CMSButton
            className={"align-self-start flex-grow-0"}
            icon={"trash"}
            onClick={props.onDelete}
            variant={"danger"}
          ></CMSButton>
        )}
      </Stack>
    </Card>
  );
}
