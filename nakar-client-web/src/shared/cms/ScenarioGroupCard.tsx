import { Card, Stack } from "react-bootstrap";
import { ScenarioDto, ScenarioGroupDto } from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";

export function ScenarioGroupCard(props: { scenarioGroup: ScenarioGroupDto }) {
  return (
    <Card>
      <CMSCardContent
        title={
          <span className={"user-select-text"}>
            {props.scenarioGroup.title}
          </span>
        }
        subtitle={`${props.scenarioGroup.scenarios.length.toString()} Scenarios`}
        icon={"easel"}
        rightBodyPaddingStart={250}
        rightBody={
          <Stack>
            <span className={"text-muted small"}>Scenarios</span>
            {props.scenarioGroup.scenarios.map((scenario: ScenarioDto) => (
              <span
                className={"muted small user-select-text"}
                key={scenario.id}
              >
                {scenario.title}
              </span>
            ))}
          </Stack>
        }
      ></CMSCardContent>
    </Card>
  );
}
