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
import { ViewSettingsColorEditor } from "../../room/visualization-panel/ViewSettingsColorEditor.tsx";

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
                  <option
                    value={
                      "resetVisualization" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Reset Visualization
                  </option>
                  <option
                    value={
                      "setGrowNodesBasedOnDegree" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Set Grow Nodes Based On Degree
                  </option>
                  <option
                    value={
                      "setRelationshipClusterSize" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Set Relationship Cluster Size
                  </option>
                  <option
                    value={
                      "setNodeColor" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Set Node Color
                  </option>
                  <option
                    value={
                      "setNodeRadius" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Set Node Radius
                  </option>
                  <option
                    value={
                      "setNodeTitleProperty" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Set Node Title Property
                  </option>
                  <option
                    value={
                      "setRelationshipColor" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Set Relationship Color
                  </option>
                  <option
                    value={
                      "setRelationshipWidth" satisfies UpdateScenarioPostActionEntryDto["type"]
                    }
                  >
                    Set Relationship Width
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>
            {(props.value.type === "compressNodes" ||
              (props.value.type === "layout" &&
                props.value.layoutAlgorithm !== "hierarchy") ||
              props.value.type === "setNodeColor" ||
              props.value.type === "setNodeRadius" ||
              props.value.type === "setNodeTitleProperty") && (
              <Col>
                <Form.Group className="" controlId="label">
                  <Form.Label>
                    Label{" "}
                    <OverlayTrigger
                      overlay={<Tooltip>Label to apply the action to.</Tooltip>}
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
              </Col>
            )}
            {((props.value.type === "layout" &&
              props.value.layoutAlgorithm === "hierarchy") ||
              props.value.type === "setRelationshipColor" ||
              props.value.type === "setRelationshipWidth") && (
              <Col>
                <Form.Group className="" controlId="relationshipType">
                  <Form.Label>Relationship Type</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="ACTED_IN"
                    className={"font-monospace"}
                    value={props.value.relationshipType}
                    onChange={(e) => {
                      props.onChange({
                        ...props.value,
                        relationshipType: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            )}
            {props.value.type === "layout" && (
              <>
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
                      <option
                        value={
                          "hierarchy" satisfies UpdateScenarioPostActionEntryDto["layoutAlgorithm"]
                        }
                      >
                        Hierarchy
                      </option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {props.value.layoutAlgorithm === "circle" && (
                  <Col>
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
                  </Col>
                )}
              </>
            )}
            {props.value.type === "setGrowNodesBasedOnDegree" && (
              <Col>
                <Form.Group className="" controlId="factor">
                  <Form.Label>Factor</Form.Label>
                  <Form.Control
                    placeholder="2"
                    type={"number"}
                    value={props.value.factor}
                    onChange={(e) => {
                      props.onChange({
                        ...props.value,
                        factor: Number(e.target.value),
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            )}
            {props.value.type === "setRelationshipClusterSize" && (
              <Col>
                <Form.Group className="" controlId="factor">
                  <Form.Label>Factor</Form.Label>
                  <Form.Control
                    placeholder="10"
                    type={"number"}
                    value={props.value.factor}
                    onChange={(e) => {
                      props.onChange({
                        ...props.value,
                        factor: Number(e.target.value),
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            )}
            {props.value.type === "setRelationshipWidth" && (
              <Col>
                <Form.Group className="" controlId="width">
                  <Form.Label>Width</Form.Label>
                  <Form.Control
                    placeholder="2"
                    type={"number"}
                    value={props.value.width}
                    onChange={(e) => {
                      props.onChange({
                        ...props.value,
                        width: Number(e.target.value),
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            )}
            {(props.value.type === "setNodeColor" ||
              props.value.type === "setRelationshipColor") && (
              <Col xs={12}>
                <Form.Group className="" controlId="color">
                  <Form.Label>Color</Form.Label>
                  <ViewSettingsColorEditor
                    colorIndex={props.value.color.index}
                    setColorIndex={(newValue) => {
                      props.onChange({
                        ...props.value,
                        color: {
                          type: "ColorPresetDto",
                          index: newValue,
                        },
                      });
                    }}
                  ></ViewSettingsColorEditor>
                </Form.Group>
              </Col>
            )}
            {props.value.type === "setNodeRadius" && (
              <Col>
                <Form.Group className="" controlId="radius">
                  <Form.Label>Radius</Form.Label>
                  <Form.Control
                    placeholder="40"
                    type={"number"}
                    value={props.value.radius}
                    onChange={(e) => {
                      props.onChange({
                        ...props.value,
                        radius: Number(e.target.value),
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            )}
            {props.value.type === "setNodeTitleProperty" && (
              <Col>
                <Form.Group className="" controlId="property">
                  <Form.Label>Property</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="name"
                    className={"font-monospace"}
                    value={props.value.property}
                    onChange={(e) => {
                      props.onChange({
                        ...props.value,
                        property: e.target.value,
                      });
                    }}
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
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
