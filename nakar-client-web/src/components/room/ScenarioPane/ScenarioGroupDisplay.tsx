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
import { NavbarButton } from "../../shared/NavbarButton.tsx";
import { Stack } from "react-bootstrap";

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
        <Stack direction={"horizontal"} className={"align-items-stretch"}>
          <div
            className={"bg-success flex-shrink-0 flex-grow-0 ms-1"}
            style={{ width: "3px" }}
          ></div>
          <Stack>
            {props.scenarioGroup.editUrl && (
              <NavbarButton
                icon={"pencil-fill"}
                title={"Edit"}
                className={
                  "border-bottom-0 border-top-0 border-start-0 border-end-0"
                }
                onClick={() => {
                  if (props.scenarioGroup.editUrl) {
                    window.open(props.scenarioGroup.editUrl, "_blank");
                  }
                }}
              ></NavbarButton>
            )}
            <ScenariosList
              scenarios={scnenarios.data}
              onScenarioSelected={props.onScenarioSelect}
              scenarioLoading={props.scenarioLoading}
            ></ScenariosList>
          </Stack>
        </Stack>
      )}
    </Collapsable>
  );
}
