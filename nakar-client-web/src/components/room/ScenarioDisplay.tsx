import { NavLink } from "react-router";
import { GetScenario } from "../../../src-gen";

export function ScenarioDisplay(props: {
  scenario: GetScenario;
  onScenarioSelected: (scenario: GetScenario) => void;
}) {
  return (
    <li>
      <NavLink
        to={"#"}
        onClick={() => {
          props.onScenarioSelected(props.scenario);
        }}
      >
        {props.scenario.title}
      </NavLink>
    </li>
  );
}
