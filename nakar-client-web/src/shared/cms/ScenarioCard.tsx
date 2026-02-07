import { Card, OverlayTrigger, Stack, Tooltip } from "react-bootstrap";
import {
  ProjectPageDto,
  ScenarioDto,
  ScenarioGroupDto,
} from "../../../src-gen";
import { CMSCardContent } from "./CMSCardContent.tsx";
import { Link } from "react-router";
import { Router } from "../../routing/Router.ts";
import { ScenarioQueryParameterBadge } from "../../room/scenarios-panel/ScenarioQueryParameterBadge.tsx";
import clsx from "clsx";
import { CSSProperties } from "react";

export function ScenarioCard(props: {
  project: ProjectPageDto;
  scenarioGroup: ScenarioGroupDto;
  scenario: ScenarioDto;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Card className={clsx(props.className)} style={props.style}>
      <CMSCardContent
        title={
          <Stack direction={"horizontal"} gap={3}>
            <OverlayTrigger
              delay={{ show: 1000, hide: 0 }}
              overlay={<Tooltip>{props.scenario.title}</Tooltip>}
            >
              <span className={"user-select-text ellipsis"}>
                {props.scenario.title}
              </span>
            </OverlayTrigger>
            <Link
              to={Router.getEditScenarioPath(
                props.project.id,
                props.scenarioGroup.id,
                props.scenario.id,
              )}
            >
              <i className={"bi bi-pen"}></i>
            </Link>
          </Stack>
        }
        subtitle={
          <Stack gap={0}>
            <Stack direction={"horizontal"} gap={1} className={"ellipsis"}>
              {props.scenario.parameters.map((parameter) => (
                <ScenarioQueryParameterBadge
                  parameter={parameter}
                  key={parameter.id}
                ></ScenarioQueryParameterBadge>
              ))}
            </Stack>
            <span>
              {props.scenario.queries.length}{" "}
              {props.scenario.queries.length === 1 ? "Query" : "Queries"}
            </span>
            {props.scenario.description ? (
              <span className={"ellipsis"}>{props.scenario.description}</span>
            ) : (
              <span className={"fst-italic"}>No description</span>
            )}
            <span>
              Actions:{" "}
              {props.scenario.postActions.length > 0 ? (
                props.scenario.postActions.join(", ")
              ) : (
                <span className={"fst-italic"}>None</span>
              )}
            </span>
          </Stack>
        }
        icon={"easel"}
      ></CMSCardContent>
    </Card>
  );
}
