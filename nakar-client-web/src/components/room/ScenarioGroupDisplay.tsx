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

export function ScenarioGroupDisplay(props: {
  scenarioGroup: ScenarioGroup;
  onScenarioSelect: (scenario: Scenario) => void;
  hidden?: boolean;
  scenarioLoading: string | null;
}) {
  const [collapsed, setCollapsed] = useState(true);
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
      <li
        hidden={props.hidden}
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
        {props.scenarioGroup.title}
        <Loading
          size={"sm"}
          hidden={scnenarios.type !== "loading"}
          className={"ms-1"}
        ></Loading>
      </li>
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
