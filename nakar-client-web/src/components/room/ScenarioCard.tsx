import { Button, Card, Stack } from "react-bootstrap";
import { ScenarioIcon } from "./ScenarioIcon.tsx";
import { QueryDisplay } from "./QueryDisplay.tsx";
import { GetScenario } from "../../../src-gen";
import { useState } from "react";
import { Loading } from "../shared/Loading.tsx";

export function ScenarioCard(props: {
  hidden?: boolean;
  scenario: GetScenario;
  onScenarioSelected: (scenario: GetScenario) => Promise<void>;
  anyScenarioIsLoading: boolean;
}) {
  const [scenarioIsLoading, setScenarioIsLoading] = useState(false);

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
            setScenarioIsLoading(true);
            props
              .onScenarioSelected(props.scenario)
              .catch(console.error)
              .then(() => {
                setScenarioIsLoading(false);
              })
              .catch(console.error);
          }}
          disabled={props.anyScenarioIsLoading}
        >
          <Stack direction={"horizontal"} gap={1}>
            {scenarioIsLoading ? (
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
