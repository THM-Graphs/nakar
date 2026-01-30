import { Card, Stack } from "react-bootstrap";
import {
  ProjectPageDto,
  ScenarioDto,
  ScenarioGroupDto,
} from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { Link } from "react-router";
import { Router } from "../../routing/Router.ts";

export function ScenarioGroupCard(props: {
  scenarioGroup: ScenarioGroupDto;
  project: ProjectPageDto;
}) {
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
              <Link
                to={Router.getEditScenarioPath(
                  props.project.id,
                  props.scenarioGroup.id,
                  scenario.id,
                )}
                key={scenario.id}
              >
                <span className={"muted small user-select-text"}>
                  {scenario.title}
                </span>
              </Link>
            ))}
            <Link
              to={Router.getAddScenarioPath(
                props.project.id,
                props.scenarioGroup.id,
              )}
            >
              <Stack className={"small"} direction={"horizontal"} gap={1}>
                <i className={"bi bi-plus-lg"}></i>
                <span>Add Scenario</span>
              </Stack>
            </Link>
          </Stack>
        }
      ></CMSCardContent>
    </Card>
  );
}
