import { Card, Stack } from "react-bootstrap";
import { ScenarioIcon } from "./ScenarioIcon.tsx";
import { QueryDisplay } from "./QueryDisplay.tsx";
import { ScenarioCardSection } from "./ScenarioCardSection.tsx";
import { ScenarioDto, ScenarioGroupDto } from "../../../src-gen";
import { Link } from "react-router";
import { useCanvasContext } from "../../pages/CanvasPage.tsx";
import { Router } from "../../routing/Router.ts";
import { CMSButton } from "../../shared/cms/CMSButton.tsx";
import { useIsLoggedIn } from "../../state/useIsLoggedIn.ts";

export function ScenarioCard(props: {
  hidden?: boolean;
  scenarioGroup: ScenarioGroupDto;
  scenario: ScenarioDto;
  onScenarioSelected: (scenario: ScenarioDto, additive: boolean) => void;
}) {
  const canvasContext = useCanvasContext();
  const isLoggedIn: boolean = useIsLoggedIn();

  return (
    <Stack
      className={"p-3 position-relative border-top border-bottom"}
      hidden={props.hidden}
    >
      <Stack gap={2}>
        <Stack direction={"horizontal"} gap={2}>
          <ScenarioIcon size={40} scenario={props.scenario}></ScenarioIcon>
          <Stack gap={0} className={"justify-content-center"}>
            <Card.Title>
              <span className={"user-select-text"}>{props.scenario.title}</span>
            </Card.Title>
            {isLoggedIn && (
              <Link
                to={Router.getEditScenarioPath(
                  canvasContext.initialRoomData.projectId,
                  props.scenarioGroup.id,
                  props.scenario.id,
                )}
                target={"_blank"}
              >
                <span className={"small"}>Edit</span>
              </Link>
            )}
          </Stack>
        </Stack>
        <CMSButton
          icon={"play-circle"}
          title={"Run Scenario"}
          onClick={() => {
            props.onScenarioSelected(props.scenario, false);
          }}
        ></CMSButton>
        <CMSButton
          title={"Add Scenario"}
          icon={"plus-circle"}
          onClick={() => {
            props.onScenarioSelected(props.scenario, false);
          }}
        ></CMSButton>

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
