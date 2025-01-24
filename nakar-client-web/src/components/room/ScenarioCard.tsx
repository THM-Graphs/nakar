import { Button, Card, Stack } from "react-bootstrap";
import { ScenarioIcon } from "./ScenarioIcon.tsx";
import { QueryDisplay } from "./QueryDisplay.tsx";
import { Scenario } from "../../../src-gen";
import { Loading } from "../shared/Loading.tsx";

export function ScenarioCard(props: {
  hidden?: boolean;
  scenario: Scenario;
  onScenarioSelected: (scenario: Scenario) => void;
  scenarioLoading: string | null;
}) {
  return (
    <Card className={"mb-2 me-2"} hidden={props.hidden}>
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
          disabled={props.scenarioLoading != null}
        >
          <Stack direction={"horizontal"} gap={1}>
            {props.scenarioLoading === props.scenario.id ? (
              <Loading size={"sm"}></Loading>
            ) : (
              <i className={"bi bi-play-circle"}></i>
            )}
            <span>Run Scenario</span>
          </Stack>
        </Button>
        <Card.Text>
          <span className={"small"} style={{ whiteSpace: "pre-line" }}>
            {props.scenario.description}
          </span>
        </Card.Text>
        {props.scenario.query && (
          <QueryDisplay query={props.scenario.query}></QueryDisplay>
        )}
      </Card.Body>
    </Card>
  );
}
