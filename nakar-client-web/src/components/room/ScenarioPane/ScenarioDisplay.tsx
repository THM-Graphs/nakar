import { Scenario } from "../../../../src-gen";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { Button } from "react-bootstrap";
import { Loading } from "../../shared/Loading.tsx";
import { Collapsable } from "../Collapsable.tsx";

export function ScenarioDisplay(props: {
  scenario: Scenario;
  onScenarioSelected: (scenario: Scenario) => void;
  hidden?: boolean;
  scenarioLoading: string | null;
}) {
  return (
    <Collapsable
      inset={0}
      title={
        <>
          <Button
            variant={"link"}
            disabled={props.scenarioLoading != null}
            size={"sm"}
            onClick={(event) => {
              event.stopPropagation();
              props.onScenarioSelected(props.scenario);
            }}
            className={"p-0 me-1"}
          >
            <i className={"bi bi-play-circle-fill"}></i>
          </Button>
          <span className={"pe-1 small"}>{props.scenario.title}</span>
          {props.scenarioLoading === props.scenario.id && (
            <Loading size={"sm"} className={"me-1 ms-1"}></Loading>
          )}
        </>
      }
    >
      <ScenarioCard
        onScenarioSelected={props.onScenarioSelected}
        scenario={props.scenario}
        scenarioLoading={props.scenarioLoading}
      ></ScenarioCard>
    </Collapsable>
  );
}
