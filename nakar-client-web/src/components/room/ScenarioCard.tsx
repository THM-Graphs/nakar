import { Button, Card, Stack } from "react-bootstrap";
import { ScenarioIcon } from "./ScenarioIcon.tsx";
import { QueryDisplay } from "./QueryDisplay.tsx";
import { GetScenario } from "../../../src-gen";

export function ScenarioCard(props: {
  hidden?: boolean;
  scenario: GetScenario;
  onScenarioSelected: (scenario: GetScenario) => void;
}) {
  return (
    <Card className={"mb-2 me-2"} {...props}>
      <Card.Body>
        <Card.Title>
          <Stack direction={"horizontal"} gap={2}>
            <ScenarioIcon size={40} scenario={props.scenario}></ScenarioIcon>
            <span>{props.scenario.title}</span>
          </Stack>
        </Card.Title>
        <Button
          size={"sm"}
          className={"mb-2 mt-2"}
          onClick={() => {
            props.onScenarioSelected(props.scenario);
          }}
        >
          <i className={"bi bi-play-circle me-1"}></i>
          Run Scenario
        </Button>
        <Card.Text>
          <span className={"small"} style={{ whiteSpace: "pre-line" }}>
            {props.scenario.description}
          </span>
        </Card.Text>
        <QueryDisplay query={props.scenario.query}></QueryDisplay>
      </Card.Body>
    </Card>
  );
}
