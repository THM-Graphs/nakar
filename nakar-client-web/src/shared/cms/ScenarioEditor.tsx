import { CMSEditTextCard } from "./CMSEditTextCard.tsx";
import { Stack } from "react-bootstrap";
import {
  DatabaseConnectionDto,
  UpdateScenarioQueryParameterEntryDto,
  UpdateScenarioRequestBodyDto,
} from "../../../src-gen";
import { QueryParametersEditor } from "./QueryParametersEditor.tsx";
import { QueriesEditor } from "./QueriesEditor.tsx";

export function ScenarioEditor(props: {
  value: UpdateScenarioRequestBodyDto;
  onChange: (newData: UpdateScenarioRequestBodyDto) => void;
  databases: DatabaseConnectionDto[];
}) {
  return (
    <Stack gap={3}>
      <Stack>
        <h5>Scenario</h5>
        <CMSEditTextCard
          title={"Title"}
          value={props.value.title}
          onChange={(e) => {
            props.onChange({ ...props.value, title: e });
          }}
        ></CMSEditTextCard>
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
    </Stack>
  );
}
