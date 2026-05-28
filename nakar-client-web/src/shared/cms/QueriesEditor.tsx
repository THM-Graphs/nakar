import { Card, Stack } from "react-bootstrap";
import { DatabaseConnectionDto, UpdateScenarioQueryEntryDto } from "api-client";
import { useCallback } from "react";
import { NavbarButton } from "../elements/NavbarButton.tsx";
import { v4 } from "uuid";
import { QueryEditor } from "./QueryEditor.tsx";

export function QueriesEditor(props: {
  value: UpdateScenarioQueryEntryDto[];
  onChange: (newEntry: UpdateScenarioQueryEntryDto[]) => void;
  databases: DatabaseConnectionDto[];
}) {
  const addQuery = useCallback(() => {
    const newQuery: UpdateScenarioQueryEntryDto = {
      id: v4(),
      query: "",
      databaseId: props.databases.length > 0 ? props.databases[0].id : "",
      isTableQuery: false,
    };
    props.onChange([...props.value, newQuery]);
  }, [props.value, props.onChange, props.databases]);

  const removeQuery = useCallback(
    (queryId: string) => {
      props.onChange(props.value.filter((q) => q.id !== queryId));
    },
    [props.value, props.onChange],
  );

  return (
    <Stack gap={1}>
      {props.value.map((queryEntry: UpdateScenarioQueryEntryDto) => (
        <QueryEditor
          key={queryEntry.id}
          value={queryEntry}
          onChange={(newQuery: UpdateScenarioQueryEntryDto): void => {
            props.onChange(
              props.value.map(
                (
                  query: UpdateScenarioQueryEntryDto,
                ): UpdateScenarioQueryEntryDto =>
                  query.id === newQuery.id ? newQuery : query,
              ),
            );
          }}
          databases={props.databases}
          onDelete={(e) => {
            e.preventDefault();
            if (queryEntry.query === "" || confirm("Remove query?")) {
              removeQuery(queryEntry.id);
            }
          }}
        ></QueryEditor>
      ))}

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
  );
}
