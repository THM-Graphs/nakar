import {
  GetDatabase,
  GetScenario,
  getScenarioGroups,
  GetScenarioGroups,
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
  database: GetDatabase;
  onScenarioSelect: (scenario: GetScenario) => Promise<void>;
  anyScenarioIsLoading: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const [scenarioGroups, setScenarioGroups] = useState<
    Loadable<GetScenarioGroups>
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
    <>
      <li style={{ listStyleType: "none" }}>
        <Stack direction={"horizontal"} gap={2}>
          <Stack
            direction={"horizontal"}
            gap={2}
            style={{ cursor: "pointer" }}
            onClick={() => {
              setCollapsed((old) => !old);
            }}
          >
            <i
              className={clsx(
                "bi",
                collapsed ? "bi-chevron-right" : "bi-chevron-down",
              )}
            ></i>
            {props.database.title}
          </Stack>
          {props.database.browserUrl && (
            <NavLink to={props.database.browserUrl} target={"_blank"}>
              <span>{props.database.browserUrl}</span>
            </NavLink>
          )}
          <Loading
            size={"sm"}
            hidden={scenarioGroups.type !== "loading"}
          ></Loading>
        </Stack>
      </li>
      {match(scenarioGroups)
        .with({ type: "error" }, ({ message }) => (
          <ErrorDisplay message={message}></ErrorDisplay>
        ))
        .with({ type: "data" }, ({ data }) => (
          <ScenarioGroupList
            hidden={collapsed}
            onScenarioSelect={props.onScenarioSelect}
            scenarioGroups={data}
            anyScenarioIsLoading={props.anyScenarioIsLoading}
          ></ScenarioGroupList>
        ))
        .otherwise(() => null)}
    </>
  );
}
