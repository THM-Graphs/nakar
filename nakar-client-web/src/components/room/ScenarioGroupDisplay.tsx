import {
  GetScenario,
  GetScenarioGroup,
  getScenarios,
  GetScenarios,
} from "../../../src-gen";
import { ScenariosList } from "./ScenariosList.tsx";
import { useEffect, useState } from "react";
import { Loadable } from "../../lib/data/Loadable.ts";
import { handleError } from "../../lib/error/handleError.ts";
import { Loading } from "../shared/Loading.tsx";
import clsx from "clsx";

export function ScenarioGroupDisplay(props: {
  scenarioGroup: GetScenarioGroup;
  onScenarioSelect: (scenario: GetScenario) => void;
  collapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [scnenarios, setScenarios] = useState<Loadable<GetScenarios>>({
    type: "loading",
  });

  useEffect(() => {
    setScenarios({ type: "loading" });
    getScenarios({ query: { scenarioGroupId: props.scenarioGroup.id } })
      .then((result) => {
        if (result.error != null) {
          alert(handleError(result.error));
        } else if (result.data != null) {
          setScenarios({ type: "data", data: result.data });
        } else {
          setScenarios({ type: "error", message: "Unknown Error" });
        }
      })
      .catch((error: unknown) => {
        setScenarios({ type: "error", message: handleError(error) });
      });
  }, [props.scenarioGroup]);

  return (
    <>
      <li
        hidden={props.collapsed}
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
          collapsed={props.collapsed || collapsed}
          onScenarioSelected={props.onScenarioSelect}
        ></ScenariosList>
      )}
    </>
  );
}
