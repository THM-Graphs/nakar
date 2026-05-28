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
import { UpdateNodeConfigurationRequestBodyDto } from "api-client";
import { CMSButton } from "./CMSButton.tsx";

export function NodeConfigurationEditor(props: {
  value: UpdateNodeConfigurationRequestBodyDto;
  onChange: (newEntry: UpdateNodeConfigurationRequestBodyDto) => void;
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
                        .value as UpdateNodeConfigurationRequestBodyDto["type"],
                    });
                  }}
                >
                  <option
                    value={
                      "link" satisfies UpdateNodeConfigurationRequestBodyDto["type"]
                    }
                  >
                    Link
                  </option>
                  <option
                    value={
                      "image" satisfies UpdateNodeConfigurationRequestBodyDto["type"]
                    }
                  >
                    Image
                  </option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="" controlId="label">
                <Form.Label>
                  Label{" "}
                  <OverlayTrigger
                    overlay={
                      <Tooltip>Label to apply this configuration to.</Tooltip>
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
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group className="" controlId="property">
                <Form.Label>
                  Property{" "}
                  <OverlayTrigger
                    overlay={
                      <Tooltip>The name of the node's property to use.</Tooltip>
                    }
                  >
                    <i className={"bi bi-info-circle"}></i>
                  </OverlayTrigger>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="imageUrl"
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
            <Col>
              <Form.Group className="" controlId="linkTemplate">
                <Form.Label>
                  Link Template{" "}
                  <OverlayTrigger
                    overlay={
                      <Tooltip>
                        The handlebars template to create the target link.
                      </Tooltip>
                    }
                  >
                    <i className={"bi bi-info-circle"}></i>
                  </OverlayTrigger>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://images.org/{{value}}.png"
                  className={"font-monospace"}
                  value={props.value.linkTemplate}
                  onChange={(e) => {
                    props.onChange({
                      ...props.value,
                      linkTemplate: e.target.value,
                    });
                  }}
                />
                <Form.Text className={"small text-muted"}>
                  Use the placeholder{" "}
                  <code className={"user-select-text code"}>
                    {"{{{value}}}"}
                  </code>{" "}
                  to insert the source property’s value. The value will be
                  URL-encoded automatically.
                </Form.Text>
              </Form.Group>
            </Col>
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
