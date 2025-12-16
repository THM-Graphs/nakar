import { useNavigate } from "react-router";
import { Stack } from "react-bootstrap";
import { NavbarButton } from "../shared/elements/NavbarButton.tsx";
import { ScenarioIcon } from "../room/scenarios-panel/ScenarioIcon.tsx";
import { Project } from "../../src-gen";
import { StringListDisplay } from "../cms/StringListDisplay.tsx";

export function ProjectDisplay(props: { project: Project }) {
  const navigate = useNavigate();
  const roomUrl = `/project/${props.project.id}`;

  return (
    <>
      <Stack direction={"horizontal"} className={"flex-shrink-0"}>
        <NavbarButton
          onClick={async () => {
            await navigate(roomUrl);
          }}
          className={"flex-shrink-1 flex-grow-1 pb-1 pt-1"}
        >
          <ScenarioIcon scenario={null} size={50}></ScenarioIcon>
          <Stack className={"flex-shrink-1 ms-2"}>
            <span className={"text-break text-wrap"}>
              {props.project.title}
            </span>
            <span className={"text-muted small"}>
              Databases:{" "}
              <StringListDisplay
                input={props.project.databases.map((d) => d.title)}
              ></StringListDisplay>
            </span>
            <span className={"text-muted small"}>
              Owner:{" "}
              {props.project.owner?.current.displayName ?? (
                <span className={"fst-italic"}>None</span>
              )}
            </span>
            <span className={"text-muted small"}>
              Collaborators:{" "}
              <StringListDisplay
                input={props.project.collaborators.map((c) => c.displayName)}
              ></StringListDisplay>
            </span>
          </Stack>
        </NavbarButton>
      </Stack>
    </>
  );
}
