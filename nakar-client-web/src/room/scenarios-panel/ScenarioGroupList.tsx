import { ScenarioGroupDisplay } from "./ScenarioGroupDisplay.tsx";
import { Stack } from "react-bootstrap";
import { ScenarioGroupDto } from "../../../src-gen";
import { Fragment } from "react";

export function ScenarioGroupList(props: {
  scenarioGroups: ScenarioGroupDto[];
}) {
  return (
    <>
      {props.scenarioGroups.length == 0 && (
        <span
          className={
            "small text-muted ms-1 fst-italic align-self-center pb-5 pt-5"
          }
        >
          empty
        </span>
      )}
      {props.scenarioGroups.length > 0 && (
        <Stack className={"flex-grow-0 pb-5"}>
          {props.scenarioGroups.map((scenarioGroup: ScenarioGroupDto) => (
            <Fragment key={scenarioGroup.id}>
              <ScenarioGroupDisplay
                scenarioGroup={scenarioGroup}
              ></ScenarioGroupDisplay>
            </Fragment>
          ))}
        </Stack>
      )}
    </>
  );
}
