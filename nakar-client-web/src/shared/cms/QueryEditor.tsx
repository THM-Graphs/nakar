import {
  Card,
  Form,
  FormSelect,
  OverlayTrigger,
  Stack,
  Tooltip,
} from "react-bootstrap";
import clsx from "clsx";
import {
  DatabaseConnectionDto,
  UpdateScenarioQueryEntryDto,
} from "../../../src-gen";
import { CypherEditor } from "@neo4j-cypher/react-codemirror";
import { CMSButton } from "./CMSButton.tsx";
import { MouseEventHandler } from "react";
import { useTheme } from "../theme/useTheme.ts";

export function QueryEditor(props: {
  value: UpdateScenarioQueryEntryDto;
  onChange: (newEntry: UpdateScenarioQueryEntryDto) => void;
  databases: DatabaseConnectionDto[];
  onDelete?: MouseEventHandler<HTMLButtonElement>;
}) {
  const theme = useTheme();

  return (
    <Card className={"p-3 gap-3 flex-grow-1"}>
      <Stack
        direction={"horizontal"}
        gap={5}
        className={"justify-content-between"}
      >
        <Form.Group>
          <Form.Label>
            Database{" "}
            <OverlayTrigger
              overlay={
                <Tooltip>Select a database to run this query on.</Tooltip>
              }
            >
              <i className={"bi bi-info-circle"}></i>
            </OverlayTrigger>
          </Form.Label>
          <FormSelect
            size={"sm"}
            className={clsx(
              props.value.databaseId === "" && "bg-danger-subtle",
            )}
            value={props.value.databaseId ?? ""}
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
        <Form.Label>
          Query{" "}
          <OverlayTrigger overlay={<Tooltip>Cypher Query</Tooltip>}>
            <i className={"bi bi-info-circle"}></i>
          </OverlayTrigger>
        </Form.Label>
        <CypherEditor
          placeholder={"MATCH (n) RETURN n;"}
          lineWrap={true}
          overrideThemeBackgroundColor={true}
          lint={true}
          value={props.value.query}
          onChange={(e) => {
            props.onChange({ ...props.value, query: e });
          }}
          theme={theme}
          className={"border"}
        ></CypherEditor>
      </Form.Group>
      <Form.Group className={""}>
        <Form.Check
          type="switch"
          label={
            <span className={""}>
              Query produces table data{" "}
              <OverlayTrigger
                overlay={
                  <Tooltip>
                    Turn this option on if your query produces table structured
                    data. The result will be displayed as table data.
                  </Tooltip>
                }
              >
                <i className={"bi bi-info-circle"}></i>
              </OverlayTrigger>
            </span>
          }
          id={`istabledata_${props.value.id}`}
          checked={props.value.isTableQuery}
          onChange={(e) => {
            props.onChange({ ...props.value, isTableQuery: e.target.checked });
          }}
        />
      </Form.Group>
    </Card>
  );
}
