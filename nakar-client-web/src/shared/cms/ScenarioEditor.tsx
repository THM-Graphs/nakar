import { Card, Form, Stack } from "react-bootstrap";
import {
  DatabaseConnectionDto,
  UpdateScenarioPostActionEntryDto,
  UpdateScenarioQueryParameterEntryDto,
  UpdateScenarioRequestBodyDto,
} from "api-client";
import { QueryParametersEditor } from "./QueryParametersEditor.tsx";
import { QueriesEditor } from "./QueriesEditor.tsx";
import { PostScenarioActionsEditor } from "./PostScenarioActionsEditor.tsx";
import MDEditor from "@uiw/react-md-editor";

export function ScenarioEditor(props: {
  value: UpdateScenarioRequestBodyDto;
  onChange: (newData: UpdateScenarioRequestBodyDto) => void;
  databases: DatabaseConnectionDto[];
}) {
  return (
    <Stack gap={5}>
      <Stack>
        <h5>Scenario</h5>
        <Card className={"p-3 gap-3"}>
          <Form.Group className="">
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              placeholder={"Title"}
              value={props.value.title}
              onChange={(e) => {
                props.onChange({ ...props.value, title: e.target.value });
              }}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <MDEditor
              value={props.value.description}
              onChange={(e) => {
                props.onChange({
                  ...props.value,
                  description: e ?? "",
                });
              }}
            />
          </Form.Group>
        </Card>
      </Stack>

      <Stack>
        <h5>Queries</h5>
        <QueriesEditor
          value={props.value.queries}
          onChange={(queries) => {
            props.onChange({ ...props.value, queries: queries });
          }}
          databases={props.databases}
        ></QueriesEditor>
      </Stack>

      <Stack>
        <h5>Query Parameters</h5>
        <QueryParametersEditor
          value={props.value.parameters}
          onChange={(parameters: UpdateScenarioQueryParameterEntryDto[]) => {
            props.onChange({ ...props.value, parameters: parameters });
          }}
        ></QueryParametersEditor>
      </Stack>

      <Stack>
        <h5>Post Scenario Actions</h5>
        <PostScenarioActionsEditor
          value={props.value.postScenarioActions}
          onChange={(
            postScenarioActions: UpdateScenarioPostActionEntryDto[],
          ) => {
            props.onChange({
              ...props.value,
              postScenarioActions: postScenarioActions,
            });
          }}
        ></PostScenarioActionsEditor>
      </Stack>
    </Stack>
  );
}
