import { Card, Form, Stack } from "react-bootstrap";
import { ProjectPageDto, UpdateCommonPropertyRequestBodyDto } from "api-client";
import { Fragment } from "react";

export function CommonPropertyEditor(props: {
  value: UpdateCommonPropertyRequestBodyDto;
  project: ProjectPageDto;
  onChange: (newValue: UpdateCommonPropertyRequestBodyDto) => void;
}) {
  return (
    <Stack direction={"horizontal"} gap={2}>
      <Card className={"p-3"}>
        <Stack gap={3}>
          <Form.Group controlId={"leftDatabase"}>
            <Form.Label>Left Database</Form.Label>
            <Form.Select
              value={props.value.leftDatabaseId}
              onChange={(e) => {
                props.onChange({
                  ...props.value,
                  leftDatabaseId: e.target.value,
                });
              }}
            >
              <option value={""}>Select a database</option>
              {props.project.databases.map((database) => (
                <Fragment key={database.id}>
                  <option value={database.id}>{database.title}</option>
                </Fragment>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId={"leftLabel"}>
            <Form.Label>Left Label</Form.Label>
            <Form.Control
              value={props.value.leftLabel}
              onChange={(e) => {
                props.onChange({
                  ...props.value,
                  leftLabel: e.target.value,
                });
              }}
            ></Form.Control>
          </Form.Group>
          <Form.Group controlId={"leftProperty"}>
            <Form.Label>Left Property</Form.Label>
            <Form.Control
              value={props.value.leftProperty}
              className={"font-monospace"}
              onChange={(e) => {
                props.onChange({
                  ...props.value,
                  leftProperty: e.target.value,
                });
              }}
            ></Form.Control>
          </Form.Group>
        </Stack>
      </Card>
      ≡
      <Card className={"p-3"}>
        <Stack gap={3}>
          <Form.Group controlId={"rightDatabase"}>
            <Form.Label>Right Database</Form.Label>
            <Form.Select
              value={props.value.rightDatabaseId}
              onChange={(e) => {
                props.onChange({
                  ...props.value,
                  rightDatabaseId: e.target.value,
                });
              }}
            >
              <option value={""}>Select a database</option>
              {props.project.databases.map((database) => (
                <Fragment key={database.id}>
                  <option value={database.id}>{database.title}</option>
                </Fragment>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group controlId={"rightLabel"}>
            <Form.Label>Right Label</Form.Label>
            <Form.Control
              value={props.value.rightLabel}
              onChange={(e) => {
                props.onChange({
                  ...props.value,
                  rightLabel: e.target.value,
                });
              }}
            ></Form.Control>
          </Form.Group>
          <Form.Group controlId={"rightProperty"}>
            <Form.Label>Right Property</Form.Label>
            <Form.Control
              value={props.value.rightProperty}
              className={"font-monospace"}
              onChange={(e) => {
                props.onChange({
                  ...props.value,
                  rightProperty: e.target.value,
                });
              }}
            ></Form.Control>
          </Form.Group>
        </Stack>
      </Card>
    </Stack>
  );
}
