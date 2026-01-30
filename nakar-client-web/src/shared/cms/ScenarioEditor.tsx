import { CMSEditTextCard } from "./CMSEditTextCard.tsx";
import { QueryEditor, QueryEntry } from "./QueryEditor.tsx";
import { Stack } from "react-bootstrap";
import { CMSButton } from "./CMSButton.tsx";
import { DatabaseConnectionDto } from "../../../src-gen";
import { useCallback } from "react";
import { v4 } from "uuid";

export type ScenarioData = {
  title: string;
  queries: QueryEntry[];
};

export function ScenarioEditor(props: {
  value: ScenarioData;
  onChange: (newData: ScenarioData) => void;
  databases: DatabaseConnectionDto[];
}) {
  const addQuery = useCallback(() => {
    const newQuery: QueryEntry = {
      id: v4(),
      query: "",
      databaseId: props.databases.length > 0 ? props.databases[0].id : "",
      isTableData: false,
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

  return (
    <Stack gap={3}>
      <CMSEditTextCard
        title={"Scenario Title"}
        value={props.value.title}
        onChange={(e) => {
          props.onChange({ ...props.value, title: e });
        }}
        subtitle={"This title will be shown in the left scenario side bar."}
      ></CMSEditTextCard>

      <hr></hr>

      <h5>Queries</h5>

      {props.value.queries.map((queryEntry: QueryEntry) => (
        <Stack
          key={queryEntry.id}
          direction={"horizontal"}
          gap={3}
          className={"align-items-start"}
        >
          <QueryEditor
            value={queryEntry}
            onChange={(newQuery: QueryEntry): void => {
              props.onChange({
                ...props.value,
                queries: props.value.queries.map(
                  (query: QueryEntry): QueryEntry =>
                    query.id === newQuery.id ? newQuery : query,
                ),
              });
            }}
            databases={props.databases}
          ></QueryEditor>
          <CMSButton
            icon={"trash"}
            variant={"danger"}
            onClick={(e) => {
              e.preventDefault();
              if (queryEntry.query === "" || confirm("Remove query?")) {
                removeQuery(queryEntry.id);
              }
            }}
          ></CMSButton>
        </Stack>
      ))}

      <CMSButton
        className={"align-self-start"}
        icon={"plus-lg"}
        onClick={(e) => {
          e.preventDefault();
          addQuery();
        }}
      ></CMSButton>
    </Stack>
  );
}
