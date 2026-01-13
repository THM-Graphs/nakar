import { Button, Card, Stack } from "react-bootstrap";
import { ScenarioIcon } from "./ScenarioIcon.tsx";
import { QueryDisplay } from "./QueryDisplay.tsx";
import { ScenarioCardSection } from "./ScenarioCardSection.tsx";
import { ScenarioDto } from "../../../src-gen";

export function ScenarioCard(props: {
  hidden?: boolean;
  scenario: ScenarioDto;
  onScenarioSelected: (scenario: ScenarioDto, additive: boolean) => void;
}) {
  return (
    <Stack
      className={"p-3 position-relative border-top border-bottom"}
      hidden={props.hidden}
    >
      <Stack gap={2}>
        <Card.Title>
          <Stack direction={"horizontal"} gap={2}>
            <ScenarioIcon size={40} scenario={props.scenario}></ScenarioIcon>
            <span className={"user-select-text"}>{props.scenario.title}</span>
          </Stack>
        </Card.Title>
        <Button
          size={"sm"}
          onClick={() => {
            props.onScenarioSelected(props.scenario, false);
          }}
        >
          <Stack direction={"horizontal"} gap={1}>
            <i className={"bi bi-play-circle"}></i>
            <span>Run Scenario</span>
          </Stack>
        </Button>
        <Button
          size={"sm"}
          onClick={() => {
            props.onScenarioSelected(props.scenario, false);
          }}
        >
          <Stack direction={"horizontal"} gap={1}>
            <i className={"bi bi-plus-circle"}></i>
            <span>Add Scenario</span>
          </Stack>
        </Button>

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
              key={q.query + (q.database?.id ?? "")}
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

        <ScenarioCardSection title={"Post Actions"}>
          {props.scenario.postActions.length > 0 ? (
            <ul className={"mb-0"}>
              {props.scenario.postActions.map((postAction: string) => (
                <li key={postAction} className={"small"}>
                  {postAction}
                </li>
              ))}
            </ul>
          ) : (
            <span className={"text-muted small fst-italic"}>None</span>
          )}
        </ScenarioCardSection>
      </Stack>
    </Stack>
  );
}
