import { GetScenario } from "../../../src-gen";
import { useState } from "react";
import clsx from "clsx";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { NavLink } from "react-router";
import { Stack } from "react-bootstrap";

export function ScenarioDisplay(props: {
  scenario: GetScenario;
  onScenarioSelected: (scenario: GetScenario) => void;
  collapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <li hidden={props.collapsed}>
      <Stack direction={"horizontal"}>
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
        <NavLink
          className={"ms-2"}
          to={"#"}
          onClick={() => {
            props.onScenarioSelected(props.scenario);
          }}
        >
          <i className={"bi bi-play-circle-fill"}></i>
        </NavLink>
      </Stack>
      <ScenarioCard
        hidden={collapsed}
        onScenarioSelected={props.onScenarioSelected}
        scenario={props.scenario}
      ></ScenarioCard>
    </li>
  );
}
