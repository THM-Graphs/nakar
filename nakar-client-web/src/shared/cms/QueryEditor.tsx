import { Card, Form, FormSelect, Stack } from "react-bootstrap";
import clsx from "clsx";
import { DatabaseConnectionDto } from "../../../src-gen";
import { CypherEditor } from "@neo4j-cypher/react-codemirror";
import { useBearStore } from "../../state/useBearStore.ts";
import { CMSButton } from "./CMSButton.tsx";
import { MouseEventHandler } from "react";

export type QueryEntry = {
  id: string;
  query: string;
  databaseId: string;
  isTableData: boolean;
};

export function QueryEditor(props: {
  value: QueryEntry;
  onChange: (newEntry: QueryEntry) => void;
  databases: DatabaseConnectionDto[];
  onDelete?: MouseEventHandler<HTMLButtonElement>;
}) {
  const getTheme = useBearStore((s) => s.global.theme.getTheme);

  return (
    <Card className={"p-3 gap-3 flex-grow-1"}>
      <Stack
        direction={"horizontal"}
        gap={5}
        className={"justify-content-between"}
      >
        <Form.Group>
          <FormSelect
            size={"sm"}
            className={clsx(
              props.value.databaseId === "" && "bg-danger-subtle",
            )}
            value={props.value.databaseId}
            onChange={(e) => {
              props.onChange({ ...props.value, databaseId: e.target.value });
            }}
          >
            <option value={""} key={""}>
              Select a database...
            </option>
            {props.databases.map((database) => (
              <option key={database.id} value={database.id}>
                {database.title}{" "}
              </option>
            ))}
          </FormSelect>
        </Form.Group>
        {props.onDelete != null && (
          <CMSButton
            className={"align-self-start"}
            icon={"trash"}
            onClick={props.onDelete}
            variant={"danger"}
          ></CMSButton>
        )}
      </Stack>
      <Form.Group>
        <Form.Label>Query</Form.Label>
        <CypherEditor
          placeholder={"MATCH (n) RETURN n;"}
          lineWrap={true}
          overrideThemeBackgroundColor={true}
          lint={true}
          value={props.value.query}
          onChange={(e) => {
            props.onChange({ ...props.value, query: e });
          }}
          theme={getTheme()}
          className={"border"}
        ></CypherEditor>
      </Form.Group>
      <Form.Group className={""}>
        <Form.Check
          type="switch"
          label={<span className={"small"}>Query produces table data.</span>}
          id={`istabledata_${props.value.id}`}
          checked={props.value.isTableData}
          onChange={(e) => {
            props.onChange({ ...props.value, isTableData: e.target.checked });
          }}
        />
      </Form.Group>
    </Card>
  );
}
