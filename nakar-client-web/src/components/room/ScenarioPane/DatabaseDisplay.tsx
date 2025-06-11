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
import { NavbarButton } from "../../shared/NavbarButton.tsx";

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
        title={
          <>
            <span className={"small fw-bold"}>{props.database.title}</span>
          </>
        }
      >
        <Stack direction={"horizontal"} className={"align-items-stretch"}>
          <div
            className={"bg-primary flex-shrink-0 flex-grow-0"}
            style={{ width: "3px" }}
          ></div>
          {match(scenarioGroups)
            .with({ type: "error" }, ({ message }) => (
              <ErrorDisplay message={message}></ErrorDisplay>
            ))
            .with({ type: "data" }, ({ data }) => (
              <Stack>
                {props.database.browserUrl && (
                  <NavbarButton
                    size={"sm"}
                    icon={"box-arrow-up-right"}
                    title={"Neo4j Browser"}
                    className={"border-start-0 border-end-0 flex-grow-1"}
                    onClick={() => {
                      if (props.database.browserUrl) {
                        window.open(props.database.browserUrl, "_blank");
                      }
                    }}
                  ></NavbarButton>
                )}
                {props.database.editUrl && (
                  <NavbarButton
                    size={"sm"}
                    icon={"pencil-fill"}
                    title={"Edit"}
                    className={"border-start-0 border-end-0 flex-grow-1"}
                    onClick={() => {
                      if (props.database.editUrl) {
                        window.open(props.database.editUrl, "_blank");
                      }
                    }}
                  ></NavbarButton>
                )}
                <ScenarioGroupList
                  onScenarioSelect={props.onScenarioSelect}
                  scenarioGroups={data}
                  scenarioLoading={props.scenarioLoading}
                ></ScenarioGroupList>
              </Stack>
            ))
            .otherwise(() => null)}
        </Stack>
      </Collapsable>
    </Stack>
  );
}
