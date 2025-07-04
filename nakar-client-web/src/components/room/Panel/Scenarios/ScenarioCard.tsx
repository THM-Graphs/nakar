import { Button, Card, Stack } from "react-bootstrap";
import { ScenarioIcon } from "./ScenarioIcon.tsx";
import { QueryDisplay } from "./QueryDisplay.tsx";
import { Scenario } from "../../../../../src-gen";
import { Loading } from "../../../shared/Loading.tsx";
import { NavbarButton } from "../../../shared/NavbarButton.tsx";
import { useBearStore } from "../../../../lib/state/useBearStore.ts";

export function ScenarioCard(props: {
  hidden?: boolean;
  scenario: Scenario;
  onScenarioSelected: (scenario: Scenario) => void;
}) {
  const uiLocked = useBearStore((s) => s.room.ui.locked);
  return (
    <Card
      className={"rounded-0 border-start-0 border-end-0 position-relative"}
      hidden={props.hidden}
    >
      {props.scenario.editUrl && (
        <NavbarButton
          icon={"pencil-fill"}
          className={
            "border-bottom-0 border-start-0 border-end-0 align-self-end position-absolute pt-1 pb-1"
          }
          onClick={() => {
            if (props.scenario.editUrl) {
              window.open(props.scenario.editUrl, "_blank");
            }
          }}
        ></NavbarButton>
      )}
      <Card.Body>
        <Card.Title>
          <Stack direction={"horizontal"} gap={2}>
            <ScenarioIcon size={40} scenario={props.scenario}></ScenarioIcon>
            <span className={"user-select-text"}>{props.scenario.title}</span>
          </Stack>
        </Card.Title>
        <Button
          size={"sm"}
          className={"mb-2 mt-2"}
          onClick={() => {
            props.onScenarioSelected(props.scenario);
          }}
          disabled={uiLocked}
        >
          <Stack direction={"horizontal"} gap={1}>
            {uiLocked ? (
              <Loading size={"sm"}></Loading>
            ) : (
              <i className={"bi bi-play-circle"}></i>
            )}
            <span>Run Scenario</span>
          </Stack>
        </Button>
        <Card.Text>
          <span
            className={"small user-select-text"}
            style={{ whiteSpace: "pre-line" }}
          >
            {props.scenario.description}
          </span>
        </Card.Text>
        {props.scenario.query && (
          <QueryDisplay query={props.scenario.query}></QueryDisplay>
        )}
        {props.scenario.parameters.length > 0 && (
          <Stack className={"mt-3"}>
            <span className={"fw-bold text-muted small"}>Parameters</span>
            <ul>
              {props.scenario.parameters.map((parameter) => (
                <li key={parameter.identifier} className={"small"}>
                  {parameter.title}{" "}
                  <span className={"text-muted font-monospace"}>
                    ({parameter.identifier})
                  </span>
                </li>
              ))}
            </ul>
          </Stack>
        )}
      </Card.Body>
    </Card>
  );
}
