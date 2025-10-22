import { RoomContext } from "../../pages/Room.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { Dropdown, Form, Spinner, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { useEffect, useState } from "react";
import {
  Database,
  DatabaseStats,
  getDatabaseStats,
  postRoomActionRunQuery,
} from "../../../src-gen";
import { Loadable } from "../../data/Loadable.ts";
import { resultOrThrow } from "../../data/resultOrThrow.ts";
import { match } from "ts-pattern";
import { Label } from "../labels/Label.tsx";
import { QueryPanelStatsDisplay } from "./QueryPanelStatsDisplay.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { DropdownButton } from "../../shared/elements/DropdownButton.tsx";

// TODO: Split into parts to prevent layout shift on login
export function QueryPanel(props: { roomContext: RoomContext }) {
  const query = useBearStore((s) => s.room.panels.query);
  const leftPanel = useBearStore((s) => s.room.panels.left);
  const locked = useBearStore((s) => s.room.ui.locked);
  const referencedDatabases = useBearStore(
    (s) => s.room.panels.scenarios.scenarios.referencedDatabases,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const username = useBearStore((s) => s.global.auth.username);
  const showLoginWindow = useBearStore((s) => s.global.auth.loginWindow.show);
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const [replace, setReplace] = useState(false);

  const referencedDatabase: Database | null =
    referencedDatabases.find((d) => d.id === selectedDatabaseId) ?? null;

  const [stats, setStats] = useState<Loadable<DatabaseStats | null>>({
    type: "loading",
  });

  const reload = () => {
    (async () => {
      setStats({ type: "loading" });
      if (referencedDatabase == null) {
        setStats({ type: "data", data: null });
      } else {
        try {
          const result = resultOrThrow(
            await getDatabaseStats({ path: { id: referencedDatabase.id } }),
          );
          setStats({ type: "data", data: result });
        } catch (error) {
          setStats({ type: "error", message: JSON.stringify(error) });
        }
      }
    })().catch(pushErrorNotification);
  };

  useEffect(() => {
    if (selectedDatabaseId === "") {
      if (referencedDatabases.length > 0) {
        setSelectedDatabaseId(referencedDatabases[0].id);
      }
    }
  }, [referencedDatabases]);

  useEffect(() => {
    reload();
  }, [selectedDatabaseId]);

  useEffect(() => {
    return () => {
      setSelectedDatabaseId("");
      query.setQueryText("");
    };
  }, []);

  return (
    <Panel
      hidden={leftPanel !== "query"}
      direction={"left"}
      title={"Query"}
      onClose={() => {
        query.hide();
      }}
      toolbar={
        <NavbarButton icon={"arrow-clockwise"} onClick={reload}></NavbarButton>
      }
    >
      {username == null && (
        <Stack
          className={"p-5 justify-content-center align-items-center"}
          gap={5}
        >
          <i className={"bi bi-file-lock2 fs-1 text-muted"}></i>
          <span className={"small text-muted"}>
            Login to see database statistics and run custom queries.
          </span>
          <NavbarButton
            title={"Login"}
            onClick={() => {
              showLoginWindow();
            }}
          ></NavbarButton>
        </Stack>
      )}
      {username && (
        <Stack className={"pb-5"} gap={5}>
          <Stack className={"flex-grow-0"}>
            <Form.Select
              className={"rounded-0 border-0 border-bottom"}
              style={{ fontSize: "13px" }}
              value={selectedDatabaseId}
              onChange={(event) => {
                setSelectedDatabaseId(event.target.value);
              }}
            >
              <option value={""} disabled={false}>
                Select a database...
              </option>
              {referencedDatabases.map((referencedDatabase) => (
                <option
                  value={referencedDatabase.id}
                  key={referencedDatabase.id}
                >
                  {referencedDatabase.title}
                </option>
              ))}
            </Form.Select>
            {referencedDatabase && (
              <>
                {referencedDatabase.editUrl != null && (
                  <NavbarButton
                    className={"flex-grow-1 border-bottom"}
                    onClick={() => {
                      window.open(referencedDatabase.editUrl ?? undefined);
                    }}
                  >
                    <i className={"bi bi-pencil-fill"}></i>
                    <span className={"ellipsis small"}>Edit</span>
                  </NavbarButton>
                )}
                {referencedDatabase.browserUrl != null && (
                  <NavbarButton
                    className={"flex-grow-1 border-bottom"}
                    onClick={() => {
                      window.open(referencedDatabase.browserUrl ?? undefined);
                    }}
                  >
                    <i className={"bi bi-box-arrow-up-right"}></i>
                    <span className={"small"}>Neo4j Browser</span>
                  </NavbarButton>
                )}
              </>
            )}
          </Stack>
          {referencedDatabase && (
            <>
              <Collapsable
                className={"flex-grow-0 border-bottom border-top"}
                initialState={false}
                title={<span className={"fw-bold small"}>Query</span>}
              >
                <textarea
                  placeholder={"MATCH p=()-[]-() RETURN p LIMIT 500"}
                  className={
                    "border-0  font-monospace border-top border-bottom"
                  }
                  style={{
                    height: "200px",
                    fontSize: "12px",
                  }}
                  value={query.queryText}
                  onChange={(event) => {
                    query.setQueryText(event.target.value);
                  }}
                ></textarea>
                <Stack
                  direction={"horizontal"}
                  className={"justify-content-between align-items-center"}
                >
                  <Stack className={"align-self-center"}>
                    <Form.Check
                      className={"m-0 ms-1"}
                      id={"replace"}
                      checked={replace}
                      onChange={(event) => {
                        setReplace(event.target.checked);
                      }}
                      label={
                        <span className={"small text-muted"}>
                          Replace Graph
                        </span>
                      }
                    ></Form.Check>
                  </Stack>
                  <DropdownButton title={"Presets"} icon={"chevron-down"}>
                    {[
                      {
                        title: "Schema Visualization",
                        query: "CALL db.schema.visualization();",
                      },
                      { title: "DB Info", query: "CALL db.info()" },
                    ].map((entry) => (
                      <Dropdown.Item
                        key={entry.query}
                        onClick={() => {
                          query.setQueryText(entry.query);
                        }}
                      >
                        <Stack>
                          <span className={"small"}>{entry.title}</span>
                          <span className={"small text-muted font-monospace"}>
                            {entry.query}
                          </span>
                        </Stack>
                      </Dropdown.Item>
                    ))}
                  </DropdownButton>
                  <NavbarButton
                    className={"justify-content-end"}
                    disabled={locked}
                    onClick={async () => {
                      resultOrThrow(
                        await postRoomActionRunQuery({
                          path: { id: props.roomContext.initialRoomData.id },
                          body: {
                            databaseId: selectedDatabaseId,
                            query: query.queryText,
                            replace: replace,
                          },
                        }),
                      );
                    }}
                  >
                    <i
                      className={
                        "bi bi-play-circle-fill btn btn-link btn-sm p-0 m-0"
                      }
                    ></i>
                    <span className={"small"}>Run</span>
                  </NavbarButton>
                </Stack>
              </Collapsable>
            </>
          )}
          {match(stats)
            .with(
              { type: "data" },
              (data) =>
                data.data != null && (
                  <>
                    <DynamicList
                      data={data.data.labels}
                      previewLimit={20}
                      className={"border-top"}
                      entityNamePlural={"Labels"}
                      collapsable={true}
                      filter={(exp, l) =>
                        l.label.toLowerCase().includes(exp.toLowerCase())
                      }
                      render={(list) => (
                        <Stack
                          direction={"horizontal"}
                          gap={1}
                          className={"flex-wrap p-1"}
                        >
                          {list.map((entry) => (
                            <Label
                              key={entry.label}
                              label={entry.label}
                              showAmount={false}
                              showSources={false}
                              onClick={() => {
                                query.setQueryText(entry.exploreQuery);
                              }}
                              roomContext={props.roomContext}
                            ></Label>
                          ))}
                        </Stack>
                      )}
                    ></DynamicList>

                    <DynamicList
                      data={data.data.rels}
                      previewLimit={20}
                      className={"border-top"}
                      entityNamePlural={"Relationships"}
                      collapsable={true}
                      filter={(exp, rel) =>
                        rel.relType.toLowerCase().includes(exp.toLowerCase())
                      }
                      render={(rels) => (
                        <Stack
                          direction={"horizontal"}
                          gap={1}
                          className={"flex-wrap p-1"}
                        >
                          {rels.map((entry) => (
                            <Label
                              key={entry.relType}
                              label={entry.relType}
                              showAmount={false}
                              showSources={false}
                              onClick={() => {
                                query.setQueryText(entry.exploreQuery);
                              }}
                              roomContext={props.roomContext}
                              hideLabelMenu={true}
                            ></Label>
                          ))}
                        </Stack>
                      )}
                    ></DynamicList>
                    <Collapsable
                      className={"flex-grow-0 border-bottom border-top"}
                      initialState={false}
                      title={<span className={"fw-bold small"}>Stats</span>}
                    >
                      <QueryPanelStatsDisplay
                        stats={[
                          {
                            label: "Nodes",
                            value: data.data.nodeCount.toString(),
                          },
                          {
                            label: "Labels",
                            value: data.data.labelCount.toString(),
                          },
                          {
                            label: "Relationships",
                            value: data.data.relCount.toString(),
                          },
                          {
                            label: "Relationship Types",
                            value: data.data.relTypeCount.toString(),
                          },
                        ]}
                      ></QueryPanelStatsDisplay>
                    </Collapsable>
                  </>
                ),
            )
            .with({ type: "loading" }, () => (
              <Spinner
                size={"sm"}
                className={"align-self-center m-5"}
              ></Spinner>
            ))
            .with({ type: "error" }, (error) => (
              <Stack>
                <span
                  className={
                    "small text-muted p-2 text-wrap text-break user-select-text"
                  }
                >
                  Error: {error.message}
                </span>
                <NavbarButton
                  title={"Reload"}
                  icon={"arrow-clockwise"}
                  onClick={reload}
                ></NavbarButton>
              </Stack>
            ))
            .exhaustive()}
        </Stack>
      )}
    </Panel>
  );
}
