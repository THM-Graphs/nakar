import { GetScenario } from "../../../src-gen";
import { useState } from "react";
import clsx from "clsx";
import { ScenarioCard } from "./ScenarioCard.tsx";
import { NavLink } from "react-router";

export function ScenarioDisplay(props: {
  scenario: GetScenario;
  onScenarioSelected: (scenario: GetScenario) => void;
  collapsed: boolean;
}) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <li hidden={props.collapsed}>
      <span
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
      </span>
      <NavLink
        to={"#"}
        className={"ms-2"}
        onClick={() => {
          props.onScenarioSelected(props.scenario);
        }}
      >
        <i className={"bi bi-play-circle-fill"}></i>
      </NavLink>
      <ScenarioCard
        hidden={collapsed}
        onScenarioSelected={props.onScenarioSelected}
        scenario={props.scenario}
      ></ScenarioCard>
    </li>
  );
}
