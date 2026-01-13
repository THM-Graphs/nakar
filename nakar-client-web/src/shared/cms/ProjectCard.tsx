import { CMSCard } from "./CMSCard.tsx";
import { Stack } from "react-bootstrap";
import { Link } from "react-router";
import { StartPageProjectDto } from "../../../src-gen";
import { StringListDisplay } from "./StringListDisplay.tsx";

export function ProjectCard(props: { project: StartPageProjectDto }) {
  return (
    <CMSCard
      title={
        <Stack>
          <Link to={`/project/${props.project.id}`}>{props.project.title}</Link>
          <span className={"text-muted small user-select-text"}>
            {props.project.owner?.displayName ?? (
              <span className={"fst-italic"}>No owner</span>
            )}
          </span>
        </Stack>
      }
      subtitle={null}
      icon={"journal-text"}
      rightBodyPaddingStart={200}
      rightBody={
        <Stack>
          <span className={"text-muted small user-select-text"}>
            Databases:{" "}
            <StringListDisplay
              input={props.project.databases.map((d) => d.title)}
            ></StringListDisplay>
          </span>
          <span className={"text-muted small user-select-text"}>
            Collaborators:{" "}
            <StringListDisplay
              input={props.project.collaborators.map((c) => c.displayName)}
            ></StringListDisplay>
          </span>
        </Stack>
      }
    ></CMSCard>
  );
}
