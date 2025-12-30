import { StartPageRoom } from "../../../src-gen";
import { CMSCard } from "./CMSCard.tsx";
import { RoomVisibilityDisplay } from "./RoomVisibilityDisplay.tsx";
import { Link } from "react-router";
import { Stack } from "react-bootstrap";

export function RoomCard(props: {
  room: StartPageRoom;
  showProjectTitle?: boolean;
  width?: number;
}) {
  return (
    <CMSCard
      width={props.width}
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
    ></CMSCard>
  );
}
