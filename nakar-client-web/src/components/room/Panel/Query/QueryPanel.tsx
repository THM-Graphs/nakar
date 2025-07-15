import { RoomContext } from "../../../../pages/Room.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";
import { Panel } from "../Panel.tsx";
import { Form, Spinner, Stack } from "react-bootstrap";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { Collapsable } from "../../Collapsable.tsx";
import { useEffect, useState } from "react";
import {
  Database,
  DatabaseStats,
  getDatabaseStats,
  postRoomActionRunQuery,
} from "../../../../../src-gen";
import { Loadable } from "../../../../lib/data/Loadable.ts";
import { resultOrThrow } from "../../../../lib/data/resultOrThrow.ts";
import { match } from "ts-pattern";
import { Label } from "../../Canvas/Label.tsx";
import { QueryPanelStatsDisplay } from "./QueryPanelStatsDisplay.tsx";
import { DynamicList } from "../../DynamicList.tsx";

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
  const [selectedDatabaseId, setSelectedDatabaseId] = useState<string>("");
  const [connectResultNodes, setConntectResultNodes] = useState(true);
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
      <Stack className={"pb-5"}>
        <Stack className={"border-bottom flex-grow-0"}>
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
              <option value={referencedDatabase.id} key={referencedDatabase.id}>
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
                  <span className={"ellipsis"}>Edit</span>
                </NavbarButton>
              )}
              {referencedDatabase.browserUrl != null && (
                <NavbarButton
                  className={"flex-grow-1"}
                  onClick={() => {
                    window.open(referencedDatabase.browserUrl ?? undefined);
                  }}
                >
                  <i className={"bi bi-box-arrow-up-right"}></i>
                  <span>Neo4j Browser</span>
                </NavbarButton>
              )}
            </>
          )}
        </Stack>
        {referencedDatabase && (
          <>
            <Collapsable
              className={"flex-grow-0 border-bottom"}
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
                className={"justify-content-between"}
              >
                <Stack>
                  <Form.Check
                    className={"ms-1"}
                    id={"connect-result-nodes"}
                    checked={connectResultNodes}
                    onChange={(event) => {
                      setConntectResultNodes(event.target.checked);
                    }}
                    label={
                      <span className={"small text-muted"}>
                        Connect Result Nodes
                      </span>
                    }
                  ></Form.Check>
                  <Form.Check
                    className={"ms-1"}
                    id={"replace"}
                    checked={replace}
                    onChange={(event) => {
                      setReplace(event.target.checked);
                    }}
                    label={<span className={"small text-muted"}>Replace</span>}
                  ></Form.Check>
                </Stack>
                <NavbarButton
                  className={"justify-content-end"}
                  disabled={locked}
                  onClick={async () => {
                    resultOrThrow(
                      await postRoomActionRunQuery({
                        path: { id: props.roomContext.initialRoomData.id },
                        body: {
                          connectResultNodes: connectResultNodes,
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
                  <span>Run</span>
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
                            showAmount={true}
                            customAmount={entry.count}
                            showSources={false}
                            onClick={() => {
                              query.setQueryText(entry.exploreQuery);
                            }}
                          ></Label>
                        ))}
                      </Stack>
                    )}
                  ></DynamicList>

                  <DynamicList
                    data={data.data.rels}
                    previewLimit={20}
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
                            showAmount={true}
                            customAmount={entry.count}
                            showSources={false}
                            onClick={() => {
                              query.setQueryText(entry.exploreQuery);
                            }}
                          ></Label>
                        ))}
                      </Stack>
                    )}
                  ></DynamicList>
                  <Collapsable
                    className={"flex-grow-0 border-bottom"}
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
            <>
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
            </>
          ))
          .exhaustive()}
      </Stack>
    </Panel>
  );
}
