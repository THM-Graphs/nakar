import { CMSEditTextCard } from "./CMSEditTextCard.tsx";
import { QueryEditor } from "./QueryEditor.tsx";
import { Card, Stack } from "react-bootstrap";
import {
  DatabaseConnectionDto,
  UpdateScenarioQueryEntryDto,
  UpdateScenarioQueryParameterEntryDto,
  UpdateScenarioRequestBodyDto,
} from "../../../src-gen";
import { useCallback } from "react";
import { v4 } from "uuid";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { QueryParameterEditor } from "./QueryParameterEditor.tsx";

export function ScenarioEditor(props: {
  value: UpdateScenarioRequestBodyDto;
  onChange: (newData: UpdateScenarioRequestBodyDto) => void;
  databases: DatabaseConnectionDto[];
}) {
  const addQuery = useCallback(() => {
    const newQuery: UpdateScenarioQueryEntryDto = {
      id: v4(),
      query: "",
      databaseId: props.databases.length > 0 ? props.databases[0].id : "",
      isTableQuery: false,
    };
    props.onChange({
      ...props.value,
      queries: [...props.value.queries, newQuery],
    });
  }, [props.value, props.onChange, props.databases]);

  const removeQuery = useCallback(
    (queryId: string) => {
      props.onChange({
        ...props.value,
        queries: props.value.queries.filter((q) => q.id !== queryId),
      });
    },
    [props.value, props.onChange],
  );

  const addQueryParameter = useCallback(() => {
    const newQueryParameter: UpdateScenarioQueryParameterEntryDto = {
      id: v4(),
      identifier: "",
      title: "",
      dataType: "string",
      defaultValue: "",
      allowedLabels: "",
    };
    props.onChange({
      ...props.value,
      parameters: [...props.value.parameters, newQueryParameter],
    });
  }, [props.value, props.onChange]);

  const removeQueryParameter = useCallback(
    (queryParameterId: string) => {
      props.onChange({
        ...props.value,
        parameters: props.value.parameters.filter(
          (p) => p.id !== queryParameterId,
        ),
      });
    },
    [props.value, props.onChange],
  );

  return (
    <Stack gap={3}>
      <Stack>
        <h5>Scenario</h5>
        <CMSEditTextCard
          title={"Scenario Title"}
          value={props.value.title}
          onChange={(e) => {
            props.onChange({ ...props.value, title: e });
          }}
          subtitle={"This title will be shown in the left scenario side bar."}
        ></CMSEditTextCard>
      </Stack>

      <Stack>
        <h5>Queries</h5>
        <Stack gap={3}>
          {props.value.queries.map(
            (queryEntry: UpdateScenarioQueryEntryDto) => (
              <QueryEditor
                key={queryEntry.id}
                value={queryEntry}
                onChange={(newQuery: UpdateScenarioQueryEntryDto): void => {
                  props.onChange({
                    ...props.value,
                    queries: props.value.queries.map(
                      (
                        query: UpdateScenarioQueryEntryDto,
                      ): UpdateScenarioQueryEntryDto =>
                        query.id === newQuery.id ? newQuery : query,
                    ),
                  });
                }}
                databases={props.databases}
                onDelete={(e) => {
                  e.preventDefault();
                  if (queryEntry.query === "" || confirm("Remove query?")) {
                    removeQuery(queryEntry.id);
                  }
                }}
              ></QueryEditor>
            ),
          )}

          <Card>
            <NavbarButton
              className={"align-self-stretch pt-1 pb-1"}
              icon={"plus-lg"}
              title={"Add Query"}
              onClick={(e) => {
                e.preventDefault();
                addQuery();
              }}
            ></NavbarButton>
          </Card>
        </Stack>
      </Stack>

      <Stack>
        <h5>Query Parameters</h5>
        <Stack gap={3}>
          {props.value.parameters.map(
            (parameter: UpdateScenarioQueryParameterEntryDto) => (
              <QueryParameterEditor
                key={parameter.id}
                value={parameter}
                onChange={(
                  newParameter: UpdateScenarioQueryParameterEntryDto,
                ): void => {
                  props.onChange({
                    ...props.value,
                    parameters: props.value.parameters.map(
                      (
                        p: UpdateScenarioQueryParameterEntryDto,
                      ): UpdateScenarioQueryParameterEntryDto =>
                        p.id === newParameter.id ? newParameter : p,
                    ),
                  });
                }}
                onDelete={(e) => {
                  e.preventDefault();
                  if (
                    parameter.identifier === "" ||
                    confirm("Remove query parameter?")
                  ) {
                    removeQueryParameter(parameter.id);
                  }
                }}
              ></QueryParameterEditor>
            ),
          )}

          <Card>
            <NavbarButton
              className={"align-self-stretch pt-1 pb-1"}
              icon={"plus-lg"}
              title={"Add Query Parameter"}
              onClick={(e) => {
                e.preventDefault();
                addQueryParameter();
              }}
            ></NavbarButton>
          </Card>
        </Stack>
      </Stack>
    </Stack>
  );
}
