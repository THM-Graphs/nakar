import { GetScenario } from "../../../src-gen";
import { useState } from "react";
import clsx from "clsx";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { Button, Stack } from "react-bootstrap";
import { Loading } from "../shared/Loading.tsx";

export function ScenarioDisplay(props: {
  scenario: GetScenario;
  onScenarioSelected: (scenario: GetScenario) => Promise<void>;
  collapsed: boolean;
  anyScenarioIsLoading: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);
  const [scenarioIsLoading, setScenarioIsLoading] = useState(false);

  return (
    <li hidden={props.collapsed}>
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
          disabled={props.anyScenarioIsLoading}
          size={"sm"}
          onClick={() => {
            setScenarioIsLoading(true);
            props
              .onScenarioSelected(props.scenario)
              .catch(console.error)
              .then(() => {
                setScenarioIsLoading(false);
              })
              .catch(console.error);
          }}
        >
          {scenarioIsLoading ? (
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
        anyScenarioIsLoading={props.anyScenarioIsLoading}
      ></ScenarioCard>
    </li>
  );
}
