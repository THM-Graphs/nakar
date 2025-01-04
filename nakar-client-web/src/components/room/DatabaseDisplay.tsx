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

export function DatabaseDisplay(props: {
  database: GetDatabase;
  onScenarioSelect: (scenario: GetScenario) => void;
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
      <li
        style={{ listStyleType: "none", cursor: "pointer" }}
        onClick={() => {
          setCollapsed((old) => !old);
        }}
      >
        <i
          className={clsx(
            "bi me-2",
            collapsed ? "bi-chevron-right" : "bi-chevron-down",
          )}
        ></i>
        {props.database.title} ({props.database.url})
        <Loading
          className={"ms-1"}
          size={"sm"}
          hidden={scenarioGroups.type !== "loading"}
        ></Loading>
      </li>
      {match(scenarioGroups)
        .with({ type: "error" }, ({ message }) => (
          <ErrorDisplay message={message}></ErrorDisplay>
        ))
        .with({ type: "data" }, ({ data }) => (
          <ScenarioGroupList
            collapsed={collapsed}
            onScenarioSelect={props.onScenarioSelect}
            scenarioGroups={data}
          ></ScenarioGroupList>
        ))
        .otherwise(() => null)}
    </>
  );
}
