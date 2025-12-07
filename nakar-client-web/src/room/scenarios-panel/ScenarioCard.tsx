import { Button, Card, Stack } from "react-bootstrap";
import { ScenarioIcon } from "./ScenarioIcon.tsx";
import { QueryDisplay } from "./QueryDisplay.tsx";
import { Scenario } from "../../../src-gen";
import { ScenarioCardSection } from "./ScenarioCardSection.tsx";
import { ActionNavbarButton } from "../../actions/ActionNavbarButton.tsx";
import { EditScenarioAction } from "../../actions/EditScenarioAction.ts";

export function ScenarioCard(props: {
  hidden?: boolean;
  scenario: Scenario;
  onScenarioSelected: (scenario: Scenario) => void;
}) {
  return (
    <Card
      className={"rounded-0 border-start-0 border-end-0 position-relative"}
      hidden={props.hidden}
    >
      {props.scenario.editUrl && (
        <ActionNavbarButton
          action={EditScenarioAction.shared}
          params={{ scenario: props.scenario }}
          className={"align-self-end position-absolute"}
          hideTitle={true}
          tooltipPlacement={"bottom"}
        ></ActionNavbarButton>
      )}
      <Card.Body>
        <Stack gap={2}>
          <Stack className={""}>
            <Card.Title>
              <Stack direction={"horizontal"} gap={2}>
                <ScenarioIcon
                  size={40}
                  scenario={props.scenario}
                ></ScenarioIcon>
                <span className={"user-select-text"}>
                  {props.scenario.title}
                </span>
              </Stack>
            </Card.Title>
            <Button
              size={"sm"}
              onClick={() => {
                props.onScenarioSelected(props.scenario);
              }}
            >
              <Stack direction={"horizontal"} gap={1}>
                <i className={"bi bi-play-circle"}></i>
                <span>Run Scenario</span>
              </Stack>
            </Button>
          </Stack>

          <ScenarioCardSection title={"Description"}>
            {props.scenario.description ? (
              <Card.Text>
                <span
                  className={"small user-select-text"}
                  style={{ whiteSpace: "pre-line" }}
                >
                  {props.scenario.description}
                </span>
              </Card.Text>
            ) : (
              <span className={"text-muted small fst-italic"}>None</span>
            )}
          </ScenarioCardSection>

          <ScenarioCardSection title={"Queries"}>
            {props.scenario.queries.map((q) => (
              <QueryDisplay
                query={q}
                key={q.query + (q.database?.current.id ?? "")}
              ></QueryDisplay>
            ))}
          </ScenarioCardSection>

          <ScenarioCardSection title={"Parameters"}>
            {props.scenario.parameters.length > 0 ? (
              <ul className={"mb-0"}>
                {props.scenario.parameters.map((parameter) => (
                  <li key={parameter.identifier} className={"small"}>
                    {parameter.title}{" "}
                    <span className={"text-muted font-monospace"}>
                      (
                      <span className={"user-select-text"}>
                        {parameter.identifier}
                      </span>
                      )
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className={"text-muted small fst-italic"}>None</span>
            )}
          </ScenarioCardSection>

          <ScenarioCardSection title={"Additive"}>
            <Card.Text>
              <span className={"small fst-italic"}>
                {props.scenario.additive ? "Yes" : "No"}
              </span>
            </Card.Text>
          </ScenarioCardSection>
        </Stack>
      </Card.Body>
    </Card>
  );
}
