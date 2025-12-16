import { Room as SchemaRoom } from "../../src-gen";
import { CMSCard } from "./CMSCard.tsx";
import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Stack } from "react-bootstrap";

export function RoomCard(props: {
  room: SchemaRoom;
  showProjectTitle?: boolean;
}) {
  return (
    <CMSCard
      title={
        <Stack>
          {props.showProjectTitle && (
            <span className={"ellipsis user-select-text"}>
              {props.room.projectTitle}
            </span>
          )}
          <Link to={`/room/${props.room.id}`}>{props.room.title}</Link>
        </Stack>
      }
      subtitle={
        <RoomVisibilityDisplay
          visibility={props.room.visibility}
        ></RoomVisibilityDisplay>
      }
      icon={"person-workspace"}
      rightBodyPaddingStart={200}
      rightBody={
        <Stack>
          <span className={"text-muted small"}>Canvases</span>
          {props.room.canvases.map((c) => (
            <Link to={`/canvas/${c.id}`} key={c.id}>
              <span key={c.id} className={"small"}>
                {c.title}
              </span>
            </Link>
          ))}
        </Stack>
      }
    ></CMSCard>
  );
}
