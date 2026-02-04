import { ScenarioGroupDto } from "../../../src-gen";
import { PropertyMenuScenarioEntry } from "./PropertyMenuScenarioEntry.tsx";

export function PropertyMenuScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroupDto;
  value: unknown;
}) {
  const scenarioGroup = props.scenarioGroup;

  return (
    <>
      {scenarioGroup.scenarios.map((scenario) => {
        return (
          <PropertyMenuScenarioEntry
            scenario={scenario}
            argumentValue={props.value}
            key={scenario.id}
          ></PropertyMenuScenarioEntry>
        );
      })}
    </>
  );
}
