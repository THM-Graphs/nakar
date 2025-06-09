import {
  Database,
  Scenario,
  getScenarioGroups,
  ScenarioGroups,
} from "../../../src-gen";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Loadable } from "../../lib/data/Loadable.ts";
import { handleError } from "../../lib/error/handleError.ts";
import { match } from "ts-pattern";
import { ErrorDisplay } from "../shared/ErrorDisplay.tsx";
import { Loading } from "../shared/Loading.tsx";
import { resultOrThrow } from "../../lib/data/resultOrThrow.ts";
import { NavLink } from "react-router";
import { Stack } from "react-bootstrap";

export function DatabaseDisplay(props: {
  database: Database;
  onScenarioSelect: (scenario: Scenario) => void;
  scenarioLoading: string | null;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const [scenarioGroups, setScenarioGroups] = useState<
    Loadable<ScenarioGroups>
  >({
    type: "loading",
  });

  useEffect(() => {
    setScenarioGroups({ type: "loading" });
    getScenarioGroups({ query: { databaseId: props.database.id } })
      .then((result) => {
        const data = resultOrThrow(result);
        setScenarioGroups({ type: "data", data: data });
      })
      .catch((error: unknown) => {
        setScenarioGroups({ type: "error", message: handleError(error) });
      });
  }, [props.database]);

  return (
    <Stack className={"border-bottom flex-grow-0"}>
      <Stack direction={"horizontal"} gap={2} className={"ms-1"}>
        <Stack
          direction={"horizontal"}
          className={"pointer"}
          onClick={() => {
            setCollapsed((old) => !old);
          }}
        >
          <i
            className={clsx(
              "bi me-1",
              collapsed ? "bi-chevron-right" : "bi-chevron-down",
            )}
          ></i>
          <span className={"fw-bold"}>{props.database.title}</span>
        </Stack>
        {props.database.browserUrl && (
          <NavLink to={props.database.browserUrl} target={"_blank"}>
            <i className={"bi bi-box-arrow-up-right"}></i>
          </NavLink>
        )}
        <Loading
          size={"sm"}
          hidden={scenarioGroups.type !== "loading"}
        ></Loading>
      </Stack>
      {match(scenarioGroups)
        .with({ type: "error" }, ({ message }) => (
          <ErrorDisplay message={message}></ErrorDisplay>
        ))
        .with({ type: "data" }, ({ data }) => (
          <ScenarioGroupList
            hidden={collapsed}
            onScenarioSelect={props.onScenarioSelect}
            scenarioGroups={data}
            scenarioLoading={props.scenarioLoading}
          ></ScenarioGroupList>
        ))
        .otherwise(() => null)}
    </Stack>
  );
}
