import { useEffect, useState } from "react";
import { GetScenario, GetScenarios, getScenarios } from "../../../src-gen";
import { ScenarioDisplay } from "./ScenarioDisplay.tsx";
import { handleError } from "../../lib/error/handleError.ts";
import { match } from "ts-pattern";
import { ErrorDisplay } from "../shared/ErrorDisplay.tsx";
import { Loading } from "../shared/Loading.tsx";
import { Loadable } from "../../lib/data/Loadable.ts";

export function ScenariosList(props: {
  scenarioGroupId: string;
  onScenarioSelected: (scenario: GetScenario) => void;
}) {
  const [scnenarios, setScenarios] = useState<Loadable<GetScenarios>>({
    type: "loading",
  });

  useEffect(() => {
    setScenarios({ type: "loading" });
    getScenarios({ query: { scenarioGroupId: props.scenarioGroupId } })
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
  }, [props.scenarioGroupId]);

  return match(scnenarios)
    .with({ type: "error" }, ({ message }) => (
      <ErrorDisplay message={message}></ErrorDisplay>
    ))
    .with({ type: "loading" }, () => <Loading></Loading>)
    .with({ type: "data" }, ({ data }) => (
      <ul>
        {data.scenarios.map((scenario: GetScenario) => (
          <ScenarioDisplay
            key={scenario.id}
            scenario={scenario}
            onScenarioSelected={(s) => {
              props.onScenarioSelected(s);
            }}
          ></ScenarioDisplay>
        ))}
      </ul>
    ))
    .exhaustive();
}
