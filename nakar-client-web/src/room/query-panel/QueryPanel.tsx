import { CanvasContext } from "../../pages/CanvasPage.tsx";
import { useBearStore } from "../../state/useBearStore.ts";
import { Panel } from "../../shared/elements/Panel.tsx";
import { Dropdown, Spinner, Stack } from "react-bootstrap";
import { NavbarButton } from "../../shared/elements/NavbarButton.tsx";
import { Collapsable } from "../../shared/elements/Collapsable.tsx";
import { useEffect, useState } from "react";
import { DatabaseConnection, postCanvasActionRunQuery } from "../../../src-gen";
import { Loadable } from "../../shared/data/Loadable.ts";
import { resultOrThrow } from "../../shared/data/resultOrThrow.ts";
import { match } from "ts-pattern";
import { Label } from "../labels/Label.tsx";
import { QueryPanelStatsDisplay } from "./QueryPanelStatsDisplay.tsx";
import { DynamicList } from "../../shared/elements/DynamicList.tsx";
import { DropdownButton } from "../../shared/elements/DropdownButton.tsx";
import { DatabaseSelect } from "../database/DatabaseSelect.tsx";
import {
  databaseConnectionControllerGetStats,
  GetDatabaseStatsResponseBodyDto,
} from "../../../src-gen-2";

// TODO: Split into parts to prevent layout shift on login
export function QueryPanel(props: { roomContext: CanvasContext }) {
  const query = useBearStore((s) => s.room.panels.query);
  const referencedDatabases = useBearStore(
    (s) => s.room.panels.scenarios.scenarios.referencedDatabases,
  );
  const pushErrorNotification = useBearStore(
    (s) => s.room.ui.pushErrorNotification,
  );
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string | null>(
    null,
  );

  const referencedDatabase: DatabaseConnection | null =
    referencedDatabases.find((d) => d.id === selectedDatabaseId) ?? null;

  const [stats, setStats] = useState<
    Loadable<GetDatabaseStatsResponseBodyDto | null>
  >({
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
            await databaseConnectionControllerGetStats({
              path: {
                databaseId: referencedDatabase.id,
                roomId: props.roomContext.initialRoomData.id,
              },
            }),
          );
          setStats({ type: "data", data: result });
        } catch (error) {
          setStats({ type: "error", message: JSON.stringify(error) });
        }
      }
    })().catch(pushErrorNotification);
  };

  useEffect(() => {
    reload();
  }, [selectedDatabaseId]);

  useEffect(() => {
    return () => {
      query.setQueryText("");
    };
  }, []);

  return (
    <Panel
      direction={"left"}
      title={"Query"}
      onClose={() => {
        query.hide();
      }}
      toolbar={
        <NavbarButton icon={"arrow-clockwise"} onClick={reload}></NavbarButton>
      }
    >
      <Stack className={"pb-5"} gap={5}>
        <Stack className={"flex-grow-0"}>
          <DatabaseSelect
            database={selectedDatabaseId}
            onChange={setSelectedDatabaseId}
          ></DatabaseSelect>
          {referencedDatabase && (
            <>
              {referencedDatabase.browserUrl.length > 0 && (
                <NavbarButton
                  className={"flex-grow-1 border-bottom"}
                  onClick={() => {
                    window.open(referencedDatabase.browserUrl);
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
                className={"border-0  font-monospace border-top border-bottom"}
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
                <DropdownButton title={"Presets"} icon={"chevron-down"}>
                  {[
                    {
                      title: "Schema Visualization",
                      query: "CALL db.schema.visualization();",
                    },
                    { title: "DB Info", query: "CALL db.info()" },
                    { title: "Indexes", query: "SHOW INDEXES" },
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
                <Stack direction="horizontal">
                  <NavbarButton
                    className={"justify-content-end"}
                    title="Run"
                    icon="play-fill"
                    onClick={async () => {
                      resultOrThrow(
                        await postCanvasActionRunQuery({
                          path: { id: props.roomContext.initialCanvasData.id },
                          body: {
                            databaseId: selectedDatabaseId ?? "",
                            query: query.queryText,
                            replace: true,
                          },
                        }),
                      );
                    }}
                  ></NavbarButton>
                  <NavbarButton
                    className={"justify-content-end"}
                    title="Add"
                    icon="plus-lg"
                    onClick={async () => {
                      resultOrThrow(
                        await postCanvasActionRunQuery({
                          path: { id: props.roomContext.initialCanvasData.id },
                          body: {
                            databaseId: selectedDatabaseId ?? "",
                            query: query.queryText,
                            replace: false,
                          },
                        }),
                      );
                    }}
                  ></NavbarButton>
                </Stack>
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
            <Spinner size={"sm"} className={"align-self-center m-5"}></Spinner>
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
    </Panel>
  );
}
