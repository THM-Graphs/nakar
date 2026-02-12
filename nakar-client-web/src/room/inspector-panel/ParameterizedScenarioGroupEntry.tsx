import { NodeDto, ScenarioGroupDto } from "../../../src-gen";
import { NodeParameterizedScenarioEntry } from "./NodeParameterizedScenarioEntry.tsx";
import { ListGroup, ListGroupItem, Stack } from "react-bootstrap";
import { Fragment } from "react";

export function ParameterizedScenarioGroupEntry(props: {
  scenarioGroup: ScenarioGroupDto;
  node: NodeDto;
  className?: string;
}) {
  const scenarioGroup = props.scenarioGroup;

  return (
    <Stack className={props.className}>
      <span className={"small fw-bold ps-2 pe-2"}>
        {props.scenarioGroup.title}
      </span>
      <ListGroup>
        {scenarioGroup.scenarios.map((scenario) => {
          return (
            <Fragment key={scenario.id}>
              <ListGroupItem
                className={
                  "rounded-0 border-start-0 border-end-0 p-0 bg-body-tertiary"
                }
              >
                <NodeParameterizedScenarioEntry
                  scenario={scenario}
                  node={props.node}
                ></NodeParameterizedScenarioEntry>
              </ListGroupItem>
            </Fragment>
          );
        })}
      </ListGroup>
    </Stack>
  );
}
