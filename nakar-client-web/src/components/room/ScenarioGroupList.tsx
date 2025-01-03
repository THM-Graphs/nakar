import { useEffect, useState } from "react";
import { match } from "ts-pattern";
import { handleError } from "../../lib/error/handleError.ts";
import { ErrorDisplay } from "../shared/ErrorDisplay.tsx";
import { Loading } from "../shared/Loading.tsx";
import {
  GetScenario,
  GetScenarioGroup,
  getScenarioGroups,
  GetScenarioGroups,
} from "../../../src-gen";
import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";
import { Loadable } from "../../lib/data/Loadable.ts";

export function ScenarioGroupList(props: {
  databaseId: string;
  onScenarioSelect: (scenario: GetScenario) => void;
}) {
  const [scenarioGroups, setScenarioGroups] = useState<
    Loadable<GetScenarioGroups>
  >({
    type: "loading",
  });

  useEffect(() => {
    setScenarioGroups({ type: "loading" });
    getScenarioGroups({ query: { databaseId: props.databaseId } })
      .then((result) => {
        if (result.error != null) {
          alert(handleError(result.error));
        } else if (result.data != null) {
          setScenarioGroups({ type: "data", data: result.data });
        } else {
          setScenarioGroups({ type: "error", message: "Unknown Error" });
        }
      })
      .catch((error: unknown) => {
        setScenarioGroups({ type: "error", message: handleError(error) });
      });
  }, [props.databaseId]);

  return match(scenarioGroups)
    .with({ type: "error" }, ({ message }) => (
      <ErrorDisplay message={message}></ErrorDisplay>
    ))
    .with({ type: "loading" }, () => <Loading></Loading>)
    .with({ type: "data" }, ({ data }) => (
      <ul>
        {data.scenarioGroups.map((scenarioGroup: GetScenarioGroup) => (
          <ScenarioGroupDisplay
            onScenarioSelect={props.onScenarioSelect}
            key={scenarioGroup.id}
            scenarioGroup={scenarioGroup}
          ></ScenarioGroupDisplay>
        ))}
      </ul>
    ))
    .exhaustive();
}
