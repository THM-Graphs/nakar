import { NodeDto, NodeParameterizedScenarioGroupDto } from "../../../src-gen";
import { NodeParameterizedScenarioEntry } from "./NodeParameterizedScenarioEntry.tsx";
import { ListGroup, ListGroupItem, Stack } from "react-bootstrap";
import { Fragment } from "react";
import { useBearStore } from "../../state/useBearStore.ts";

export function ParameterizedScenarioGroupEntry(props: {
  scenarioGroup: NodeParameterizedScenarioGroupDto;
  nodes: NodeDto[];
  className?: string;
}) {
  const parameterizedScenarioGroup = props.scenarioGroup;
  const scenarioGroups = useBearStore(
    (s) => s.room.panels.scenarios.scenarios.scenarioGroups,
  );
  const scenarioGroup = scenarioGroups.find(
    (sg) => sg.id === parameterizedScenarioGroup.id,
  );
  if (scenarioGroup == null) {
    return null;
  }
  return (
    <Stack className={props.className}>
      <span className={"small fw-bold ps-2 pe-2"}>{scenarioGroup.title}</span>
      <ListGroup>
        {parameterizedScenarioGroup.scenarios.map((parameterizedScenario) => {
          const scenario = scenarioGroup.scenarios.find(
            (s) => s.id === parameterizedScenario.id,
          );
          if (scenario == null) {
            return null;
          }
          return (
            <Fragment key={parameterizedScenario.id}>
              <ListGroupItem
                className={
                  "rounded-0 border-start-0 border-end-0 p-0 bg-body-tertiary"
                }
              >
                <NodeParameterizedScenarioEntry
                  scenario={scenario}
                  nodes={props.nodes}
                ></NodeParameterizedScenarioEntry>
              </ListGroupItem>
            </Fragment>
          );
        })}
      </ListGroup>
    </Stack>
  );
}
