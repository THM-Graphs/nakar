import { Alert, Button, Card, Stack } from "react-bootstrap";
import {
  ProjectPageDto,
  scenarioControllerCreateScenario,
  ScenarioDto,
  ScenarioGroupDto,
} from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { Link, useNavigate } from "react-router";
import { Router } from "../../routing/Router.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { useState } from "react";
import { handleError } from "../error/handleError.ts";

export function ScenarioGroupCard(props: {
  scenarioGroup: ScenarioGroupDto;
  project: ProjectPageDto;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <CMSCardContent
        title={
          <Link
            to={Router.getEditScenarioGroupPath(
              props.project.id,
              props.scenarioGroup.id,
            )}
          >
            <span className={"user-select-text"}>
              {props.scenarioGroup.title}
            </span>
          </Link>
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
            <Button
              variant={"icon"}
              onClick={() => {
                scenarioControllerCreateScenario({
                  path: {
                    projectId: props.project.id,
                    scenarioGroupId: props.scenarioGroup.id,
                  },
                })
                  .then(resultOrThrow)
                  .then((s) =>
                    navigate(
                      Router.getEditScenarioPath(
                        props.project.id,
                        props.scenarioGroup.id,
                        s.id,
                      ),
                    ),
                  )
                  .catch((e: unknown) => {
                    setError(handleError(e));
                  });
              }}
            >
              <Stack className={"small"} direction={"horizontal"} gap={1}>
                <i className={"bi bi-plus-lg"}></i>
                <span>Add Scenario</span>
              </Stack>
            </Button>
            {error && (
              <Alert
                variant={"danger"}
                onClose={() => {
                  setError(null);
                }}
                dismissible
              >
                {error}
              </Alert>
            )}
          </Stack>
        }
      ></CMSCardContent>
    </Card>
  );
}
