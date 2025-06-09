import {
  Scenario,
  ScenarioGroup,
  getScenarios,
  Scenarios,
} from "../../../src-gen";
import { ScenariosList } from "./ScenariosList.tsx";
import { useEffect, useState } from "react";
import { Loadable } from "../../lib/data/Loadable.ts";
import { handleError } from "../../lib/error/handleError.ts";
import { Loading } from "../shared/Loading.tsx";
import clsx from "clsx";
import { resultOrThrow } from "../../lib/data/resultOrThrow";
import { Stack } from "react-bootstrap";

export function ScenarioGroupDisplay(props: {
  scenarioGroup: ScenarioGroup;
  onScenarioSelect: (scenario: Scenario) => void;
  hidden?: boolean;
  scenarioLoading: string | null;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [scnenarios, setScenarios] = useState<Loadable<Scenarios>>({
    type: "loading",
  });

  useEffect(() => {
    setScenarios({ type: "loading" });
    getScenarios({ query: { scenarioGroupId: props.scenarioGroup.id } })
      .then((result) => {
        const data = resultOrThrow(result);
        setScenarios({ type: "data", data: data });
      })
      .catch((error: unknown) => {
        setScenarios({ type: "error", message: handleError(error) });
      });
  }, [props.scenarioGroup]);

  return (
    <>
      <Stack
        className={"border-top pointer"}
        direction={"horizontal"}
        hidden={props.hidden}
        onClick={() => {
          setCollapsed((old) => !old);
        }}
      >
        <i
          className={clsx(
            "bi me-1 ms-1",
            collapsed ? "bi-chevron-right" : "bi-chevron-down",
          )}
        ></i>
        <span className={"small text-muted"}>{props.scenarioGroup.title}</span>
        <Loading
          size={"sm"}
          hidden={scnenarios.type !== "loading"}
          className={"ms-1"}
        ></Loading>
      </Stack>
      {scnenarios.type == "data" && (
        <ScenariosList
          scenarios={scnenarios.data}
          hidden={props.hidden || collapsed}
          onScenarioSelected={props.onScenarioSelect}
          scenarioLoading={props.scenarioLoading}
        ></ScenariosList>
      )}
    </>
  );
}
