import { ScenarioGroupPreview } from "../../src-gen";
import { CMSCard } from "./CMSCard.tsx";
import { Stack } from "react-bootstrap";

export function ScenarioGroupCard(props: {
  scenarioGroup: ScenarioGroupPreview;
}) {
  return (
    <CMSCard
      title={
        <span className={"user-select-text"}>{props.scenarioGroup.title}</span>
      }
      subtitle={`${props.scenarioGroup.scenarios.length.toString()} Scenarios`}
      icon={"easel"}
      rightBodyPaddingStart={250}
      rightBody={
        <Stack>
          <span className={"text-muted small"}>Scenarios</span>
          {props.scenarioGroup.scenarios.map((scenario) => (
            <span className={"muted small user-select-text"} key={scenario.id}>
              {scenario.title}
            </span>
          ))}
        </Stack>
      }
    ></CMSCard>
  );
}
