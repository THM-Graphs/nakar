import { Card, Col, Form, OverlayTrigger, Row, Tooltip } from "react-bootstrap";
import { MouseEventHandler } from "react";
import { UpdateScenarioQueryParameterEntryDto } from "../../../src-gen";

export function QueryParameterEditor(props: {
  value: UpdateScenarioQueryParameterEntryDto;
  onChange: (newEntry: UpdateScenarioQueryParameterEntryDto) => void;
  onDelete?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <Card className={"p-3 gap-3 flex-grow-1"}>
      <Row>
        <Col>
          <Form.Group className="" controlId="identifier">
            <Form.Label>
              Identifier{" "}
              <OverlayTrigger
                overlay={
                  <Tooltip>
                    This is the name of the variable to use in the cypher query.
                    Example: Use the identifier "firstName" and the variable{" "}
                    <code>$firstName</code> in cypher.
                  </Tooltip>
                }
              >
                <i className={"bi bi-info-circle"}></i>
              </OverlayTrigger>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="firstName"
              className={"font-monospace"}
              value={props.value.identifier}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="" controlId="title">
            <Form.Label>
              Title{" "}
              <OverlayTrigger
                overlay={
                  <Tooltip>
                    This is the title of the parameter to be shown in the
                    scenario panel.
                  </Tooltip>
                }
              >
                <i className={"bi bi-info-circle"}></i>
              </OverlayTrigger>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="First Name"
              value={props.value.title}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="" controlId="defaultValue">
            <Form.Label>
              Default Value{" "}
              <OverlayTrigger
                overlay={
                  <Tooltip>
                    Provide a default value to enable users to explore this
                    scenario without providing a value for themselves.
                  </Tooltip>
                }
              >
                <i className={"bi bi-info-circle"}></i>
              </OverlayTrigger>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="John Doe"
              value={props.value.defaultValue}
            />
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col>
          <Form.Group className="" controlId="allowedLabels">
            <Form.Label>
              Allowed Labels{" "}
              <OverlayTrigger
                overlay={
                  <Tooltip>
                    This is the title of the parameter to be shown in the
                    scenario panel.
                  </Tooltip>
                }
              >
                <i className={"bi bi-info-circle"}></i>
              </OverlayTrigger>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder="Person, Entity"
              value={props.value.allowedLabels}
            />
          </Form.Group>
        </Col>
        <Col>
          <Form.Group className="" controlId="dataType">
            <Form.Label>
              Datatype{" "}
              <OverlayTrigger
                overlay={
                  <Tooltip>
                    Control how the system interprets a value and how it is
                    provided in the query. Use JSON to provide arrays.
                  </Tooltip>
                }
              >
                <i className={"bi bi-info-circle"}></i>
              </OverlayTrigger>
            </Form.Label>
            <Form.Select value={props.value.dataType}>
              <option>Open this select menu</option>
              <option
                value={
                  "string" satisfies UpdateScenarioQueryParameterEntryDto["dataType"]
                }
              >
                String
              </option>
              <option
                value={
                  "number" satisfies UpdateScenarioQueryParameterEntryDto["dataType"]
                }
              >
                Number
              </option>
              <option
                value={
                  "json" satisfies UpdateScenarioQueryParameterEntryDto["dataType"]
                }
              >
                JSON
              </option>
              <option
                value={
                  "startDateTime" satisfies UpdateScenarioQueryParameterEntryDto["dataType"]
                }
              >
                Start Date Time
              </option>
              <option
                value={
                  "endDateTime" satisfies UpdateScenarioQueryParameterEntryDto["dataType"]
                }
              >
                End Date Time
              </option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>
    </Card>
  );
}
