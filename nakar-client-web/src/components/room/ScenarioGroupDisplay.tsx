import { GetScenario, GetScenarioGroup } from "../../../src-gen";
import { ScenariosList } from "./ScenariosList.tsx";

export function ScenarioGroupDisplay(props: {
  scenarioGroup: GetScenarioGroup;
  onScenarioSelect: (scenario: GetScenario) => void;
}) {
  return (
    <>
      <li>{props.scenarioGroup.title}</li>
      <ScenariosList
        onScenarioSelected={props.onScenarioSelect}
        scenarioGroupId={props.scenarioGroup.id}
      ></ScenariosList>
    </>
  );
}
