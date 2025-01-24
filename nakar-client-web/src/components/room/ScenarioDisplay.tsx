import { Scenario } from "../../../src-gen";
import { useState } from "react";
import clsx from "clsx";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { Button, Stack } from "react-bootstrap";
import { Loading } from "../shared/Loading.tsx";

export function ScenarioDisplay(props: {
  scenario: Scenario;
  onScenarioSelected: (scenario: Scenario) => void;
  hidden?: boolean;
  scenarioLoading: string | null;
}) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <li hidden={props.hidden}>
      <Stack direction={"horizontal"} gap={0}>
        <Stack
          direction={"horizontal"}
          style={{ listStyleType: "none", cursor: "pointer" }}
          onClick={() => {
            setCollapsed((old) => !old);
          }}
        >
          <i
            className={clsx(
              "bi me-2",
              collapsed ? "bi-chevron-right" : "bi-chevron-down",
            )}
          ></i>
          <span>{props.scenario.title}</span>
        </Stack>
        <Button
          variant={"link"}
          disabled={props.scenarioLoading != null}
          size={"sm"}
          onClick={() => {
            props.onScenarioSelected(props.scenario);
          }}
        >
          {props.scenarioLoading === props.scenario.id ? (
            <Loading size={"sm"}></Loading>
          ) : (
            <i className={"bi bi-play-circle-fill"}></i>
          )}
        </Button>
      </Stack>
      <ScenarioCard
        hidden={collapsed}
        onScenarioSelected={props.onScenarioSelected}
        scenario={props.scenario}
        scenarioLoading={props.scenarioLoading}
      ></ScenarioCard>
    </li>
  );
}
