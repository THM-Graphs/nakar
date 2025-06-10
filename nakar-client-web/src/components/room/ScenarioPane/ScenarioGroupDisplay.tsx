import {
  Scenario,
  ScenarioGroup,
  getScenarios,
  Scenarios,
} from "../../../../src-gen";
import { ScenariosList } from "./ScenariosList.tsx";
import { useEffect, useState } from "react";
import { Loadable } from "../../../lib/data/Loadable.ts";
import { handleError } from "../../../lib/error/handleError.ts";
import { Loading } from "../../shared/Loading.tsx";
import { resultOrThrow } from "../../../lib/data/resultOrThrow.ts";
import { Collapsable } from "../Collapsable.tsx";

export function ScenarioGroupDisplay(props: {
  scenarioGroup: ScenarioGroup;
  onScenarioSelect: (scenario: Scenario) => void;
  hidden?: boolean;
  scenarioLoading: string | null;
}) {
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
    <Collapsable
      initialState={false}
      title={
        <>
          <span className={"small text-muted"}>
            {props.scenarioGroup.title}
          </span>
          <Loading
            size={"sm"}
            hidden={scnenarios.type !== "loading"}
            className={"ms-1"}
          ></Loading>
        </>
      }
    >
      {scnenarios.type == "data" && (
        <ScenariosList
          scenarios={scnenarios.data}
          onScenarioSelected={props.onScenarioSelect}
          scenarioLoading={props.scenarioLoading}
        ></ScenariosList>
      )}
    </Collapsable>
  );
}
