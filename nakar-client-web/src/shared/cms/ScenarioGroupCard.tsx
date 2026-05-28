import { Alert, Card, Stack } from "react-bootstrap";
import {
  ProjectPageDto,
  scenarioControllerCreateScenario,
  ScenarioDto,
  ScenarioGroupDto,
} from "api-client";
import { Link, useNavigate } from "react-router";
import { Router } from "../../routing/Router.ts";
import { resultOrThrow } from "../data/resultOrThrow.ts";
import { Fragment, useState } from "react";
import { handleError } from "../error/handleError.ts";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { NavbarButton } from "../elements/NavbarButton.tsx";

export function ScenarioGroupCard(props: {
  scenarioGroup: ScenarioGroupDto;
  project: ProjectPageDto;
}) {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const onAdd = () => {
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
  };

  return (
    <>
      <Stack direction={"vertical"} gap={0}>
        <Stack className={"flex-grow-0 flex-shrink-0"}>
          <Stack
            direction={"horizontal"}
            className={"align-items-baseline"}
            gap={3}
          >
            <h5 className={"user-select-text"}>{props.scenarioGroup.title}</h5>
            <Link
              to={Router.getEditScenarioGroupPath(
                props.project.id,
                props.scenarioGroup.id,
              )}
            >
              <i className={"bi bi-pen small"}></i>
            </Link>
          </Stack>
        </Stack>
        <Stack gap={3}>
          <Stack
            direction={"horizontal"}
            className={"flex-wrap flex-grow-1"}
            gap={3}
          >
            {props.scenarioGroup.scenarios.map((scenario: ScenarioDto) => (
              <Fragment key={scenario.id}>
                <ScenarioCard
                  className={"align-self-stretch "}
                  style={{ width: "420px" }}
                  project={props.project}
                  scenarioGroup={props.scenarioGroup}
                  scenario={scenario}
                ></ScenarioCard>
              </Fragment>
            ))}
          </Stack>
          <Card className={"align-self-start"}>
            <NavbarButton
              icon={"plus-lg"}
              title={"Add Scenario"}
              className={"p-1"}
              onClick={() => {
                onAdd();
              }}
            ></NavbarButton>
          </Card>
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
      </Stack>
    </>
  );
}
