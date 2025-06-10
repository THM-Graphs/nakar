import {
  Database,
  Scenario,
  getScenarioGroups,
  ScenarioGroups,
} from "../../../../src-gen";
import { ScenarioGroupList } from "./ScenarioGroupList.tsx";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { Loadable } from "../../../lib/data/Loadable.ts";
import { handleError } from "../../../lib/error/handleError.ts";
import { match } from "ts-pattern";
import { ErrorDisplay } from "../../shared/ErrorDisplay.tsx";
import { Loading } from "../../shared/Loading.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { NavLink } from "react-router";
import { Button, Stack } from "react-bootstrap";
import { Collapsable } from "../Collapsable.tsx";

export function DatabaseDisplay(props: {
  database: Database;
  onScenarioSelect: (scenario: Scenario) => void;
  scenarioLoading: string | null;
}) {
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
      <Collapsable
        initialState={true}
        title={<span className={"fw-bold"}>{props.database.title}</span>}
      >
        {match(scenarioGroups)
          .with({ type: "error" }, ({ message }) => (
            <ErrorDisplay message={message}></ErrorDisplay>
          ))
          .with({ type: "data" }, ({ data }) => (
            <ScenarioGroupList
              onScenarioSelect={props.onScenarioSelect}
              scenarioGroups={data}
              scenarioLoading={props.scenarioLoading}
            ></ScenarioGroupList>
          ))
          .otherwise(() => null)}
      </Collapsable>
    </Stack>
  );
}
